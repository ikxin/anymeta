import {
  Kind,
  parse,
  type FragmentDefinitionNode,
  type OperationDefinitionNode,
  type SelectionSetNode,
  type ValueNode,
  type VariableDefinitionNode,
} from 'graphql'

const MAX_BODY_BYTES = 64 * 1024
const MAX_QUERY_DEPTH = 12
const MAX_DEFINITION_COUNT = 100
const MAX_FRAGMENT_HOPS = 50

export interface GraphqlFieldPolicy {
  readonly [fieldName: string]: true | GraphqlFieldPolicy
}

interface GraphqlValidationOptions {
  maxFields: number
  fields?: GraphqlFieldPolicy
  argumentBounds: Readonly<Record<string, { minimum: number; maximum: number }>>
  allowNullVariables?: boolean
  allowOtherLiterals?: boolean
}

interface GraphqlPayload {
  query: string
  operationName?: string | null
  variables?: Record<string, unknown> | null
}

interface GraphqlContext {
  options: GraphqlValidationOptions
  fragments: Map<string, FragmentDefinitionNode>
  variables: Record<string, unknown>
  defaults: Map<string, ValueNode>
  fields: number
}

export class GraphqlValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GraphqlValidationError'
  }
}

export function createGraphqlValidator(options: GraphqlValidationOptions) {
  return (rawBody: string | undefined) => {
    if (!rawBody) {
      throw new GraphqlValidationError('The GraphQL request body cannot be empty.')
    }
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      throw new GraphqlValidationError('The GraphQL request body cannot exceed 64 KiB.')
    }

    let payload: unknown
    try {
      payload = JSON.parse(rawBody)
    } catch {
      throw new GraphqlValidationError('The GraphQL request body must be valid JSON.')
    }
    if (!isRecord(payload) || typeof payload.query !== 'string' || !payload.query.trim()) {
      throw new GraphqlValidationError(
        'The GraphQL request body must contain a non-empty query field.',
      )
    }
    if (
      payload.operationName !== undefined &&
      payload.operationName !== null &&
      typeof payload.operationName !== 'string'
    ) {
      throw new GraphqlValidationError('operationName must be a string.')
    }
    if (
      payload.variables !== undefined &&
      payload.variables !== null &&
      !isRecord(payload.variables)
    ) {
      throw new GraphqlValidationError('variables must be a JSON object.')
    }

    inspectDocument(payload as unknown as GraphqlPayload, options)
    return rawBody
  }
}

function inspectDocument(payload: GraphqlPayload, options: GraphqlValidationOptions) {
  let document
  try {
    document = parse(payload.query)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to parse the query.'
    throw new GraphqlValidationError(`GraphQL syntax error: ${message}`)
  }
  if (document.definitions.length > MAX_DEFINITION_COUNT) {
    throw new GraphqlValidationError(
      `The GraphQL document cannot contain more than ${MAX_DEFINITION_COUNT} definitions.`,
    )
  }

  const operations: OperationDefinitionNode[] = []
  const fragments = new Map<string, FragmentDefinitionNode>()
  for (const definition of document.definitions) {
    if (definition.kind === Kind.OPERATION_DEFINITION) {
      if (definition.operation !== 'query') {
        throw new GraphqlValidationError(
          'The anonymous proxy allows GraphQL queries only; mutations and subscriptions are not allowed.',
        )
      }
      operations.push(definition)
      continue
    }
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      if (fragments.has(definition.name.value)) {
        throw new GraphqlValidationError(
          `Fragment ${definition.name.value} is defined more than once.`,
        )
      }
      fragments.set(definition.name.value, definition)
      continue
    }
    throw new GraphqlValidationError('The request contains a non-executable GraphQL definition.')
  }

  if (operations.length === 0) {
    throw new GraphqlValidationError('The GraphQL request must contain a query operation.')
  }

  const operation = selectOperation(operations, payload.operationName)
  inspectSelectionSet(operation.selectionSet, options.fields, [], new Set(), {
    options,
    fragments,
    variables: payload.variables || {},
    defaults: readVariableDefaults(operation.variableDefinitions),
    fields: 0,
  })
}

function selectOperation(
  operations: OperationDefinitionNode[],
  operationName: string | null | undefined,
) {
  if (operationName) {
    const selected = operations.find((operation) => operation.name?.value === operationName)
    if (!selected) {
      throw new GraphqlValidationError(`No GraphQL query named ${operationName} was found.`)
    }
    return selected
  }
  if (operations.length !== 1) {
    throw new GraphqlValidationError(
      'operationName is required when multiple queries are provided.',
    )
  }
  return operations[0]!
}

function readVariableDefaults(definitions: readonly VariableDefinitionNode[] | undefined) {
  const defaults = new Map<string, ValueNode>()
  for (const definition of definitions || []) {
    if (definition.defaultValue) {
      defaults.set(definition.variable.name.value, definition.defaultValue)
    }
  }
  return defaults
}

function inspectSelectionSet(
  selectionSet: SelectionSetNode,
  policy: GraphqlFieldPolicy | undefined,
  path: string[],
  activeFragments: Set<string>,
  context: GraphqlContext,
) {
  for (const selection of selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      const fieldName = selection.name.value
      const fieldPath = [...path, fieldName]
      context.fields += 1
      if (context.fields > context.options.maxFields) {
        throw new GraphqlValidationError(
          `The GraphQL query cannot contain more than ${context.options.maxFields} fields.`,
        )
      }
      if (fieldPath.length > MAX_QUERY_DEPTH) {
        throw new GraphqlValidationError(
          `The GraphQL query depth cannot exceed ${MAX_QUERY_DEPTH}.`,
        )
      }

      if (policy && fieldName === '__typename') {
        if (selection.selectionSet) {
          throw new GraphqlValidationError('__typename cannot have subfields.')
        }
        continue
      }

      const fieldPolicy =
        policy && Object.hasOwn(policy, fieldName) ? policy[fieldName] : undefined
      if (policy && !fieldPolicy) {
        throw new GraphqlValidationError(
          `The anonymous proxy does not allow the field ${fieldPath.join('.')}.`,
        )
      }

      inspectBoundedArguments(selection.arguments || [], context)
      if (selection.selectionSet) {
        if (fieldPolicy === true) {
          throw new GraphqlValidationError(
            `The field ${fieldPath.join('.')} cannot have subfields.`,
          )
        }
        inspectSelectionSet(
          selection.selectionSet,
          fieldPolicy,
          fieldPath,
          activeFragments,
          context,
        )
      } else if (fieldPolicy && fieldPolicy !== true) {
        throw new GraphqlValidationError(
          `The field ${fieldPath.join('.')} must select allowlisted public subfields.`,
        )
      }
      continue
    }

    if (selection.kind === Kind.INLINE_FRAGMENT) {
      inspectSelectionSet(selection.selectionSet, policy, path, activeFragments, context)
      continue
    }

    const fragmentName = selection.name.value
    const fragment = context.fragments.get(fragmentName)
    if (!fragment) {
      throw new GraphqlValidationError(`Fragment ${fragmentName} was not found.`)
    }
    if (activeFragments.has(fragmentName)) {
      throw new GraphqlValidationError(`Fragment ${fragmentName} contains a cyclic reference.`)
    }
    if (activeFragments.size >= MAX_FRAGMENT_HOPS) {
      throw new GraphqlValidationError(
        `GraphQL fragment nesting cannot exceed ${MAX_FRAGMENT_HOPS} levels.`,
      )
    }

    const nextActiveFragments = new Set(activeFragments)
    nextActiveFragments.add(fragmentName)
    inspectSelectionSet(fragment.selectionSet, policy, path, nextActiveFragments, context)
  }
}

function inspectBoundedArguments(
  args: readonly { name: { value: string }; value: ValueNode }[],
  context: GraphqlContext,
) {
  for (const argument of args) {
    const name = argument.name.value
    if (!Object.hasOwn(context.options.argumentBounds, name)) {
      continue
    }
    const bound = context.options.argumentBounds[name]!
    const value = resolveInteger(argument.value, context, name)
    if (
      value !== undefined &&
      (!Number.isInteger(value) || value < bound.minimum || value > bound.maximum)
    ) {
      throw new GraphqlValidationError(
        `${name} must be an integer between ${bound.minimum} and ${bound.maximum}.`,
      )
    }
  }
}

function resolveInteger(
  value: ValueNode,
  context: GraphqlContext,
  argumentName: string,
): number | undefined {
  if (value.kind === Kind.INT) {
    return Number.parseInt(value.value, 10)
  }
  if (value.kind === Kind.NULL) {
    return undefined
  }
  if (value.kind !== Kind.VARIABLE) {
    if (context.options.allowOtherLiterals) {
      return undefined
    }
    throw new GraphqlValidationError(`${argumentName} must be an integer.`)
  }

  const name = value.name.value
  if (Object.hasOwn(context.variables, name)) {
    const variable = context.variables[name]
    if (context.options.allowNullVariables && (variable === null || variable === undefined)) {
      return undefined
    }
    if (typeof variable !== 'number') {
      throw new GraphqlValidationError(`Variable ${name} must be an integer.`)
    }
    return variable
  }

  const defaultValue = context.defaults.get(name)
  return defaultValue ? resolveInteger(defaultValue, context, argumentName) : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
