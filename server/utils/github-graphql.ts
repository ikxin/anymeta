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
const MAX_FIELD_COUNT = 500
const MAX_PAGE_SIZE = 100
const MAX_DEFINITION_COUNT = 100
const MAX_FRAGMENT_HOPS = 50

interface GithubGraphqlPayload {
  query: string
  operationName?: string | null
  variables?: Record<string, unknown> | null
}

export class GithubGraphqlValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GithubGraphqlValidationError'
  }
}

export function validateGithubGraphqlBody(rawBody: string | undefined) {
  if (!rawBody) {
    throw new GithubGraphqlValidationError('The GraphQL request body cannot be empty.')
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    throw new GithubGraphqlValidationError('The GraphQL request body cannot exceed 64 KiB.')
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    throw new GithubGraphqlValidationError('The GraphQL request body must be valid JSON.')
  }
  if (!isRecord(payload) || typeof payload.query !== 'string' || !payload.query.trim()) {
    throw new GithubGraphqlValidationError(
      'The GraphQL request body must contain a non-empty query field.',
    )
  }
  if (
    payload.operationName !== undefined &&
    payload.operationName !== null &&
    typeof payload.operationName !== 'string'
  ) {
    throw new GithubGraphqlValidationError('operationName must be a string.')
  }
  if (
    payload.variables !== undefined &&
    payload.variables !== null &&
    !isRecord(payload.variables)
  ) {
    throw new GithubGraphqlValidationError('variables must be a JSON object.')
  }

  inspectDocument(payload as unknown as GithubGraphqlPayload)
  return rawBody
}

function inspectDocument(payload: GithubGraphqlPayload) {
  let document
  try {
    document = parse(payload.query)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to parse the query.'
    throw new GithubGraphqlValidationError(`GraphQL syntax error: ${message}`)
  }
  if (document.definitions.length > MAX_DEFINITION_COUNT) {
    throw new GithubGraphqlValidationError(
      `The GraphQL document cannot contain more than ${MAX_DEFINITION_COUNT} definitions.`,
    )
  }

  const operations: OperationDefinitionNode[] = []
  const fragments = new Map<string, FragmentDefinitionNode>()
  for (const definition of document.definitions) {
    if (definition.kind === Kind.OPERATION_DEFINITION) {
      if (definition.operation !== 'query') {
        throw new GithubGraphqlValidationError(
          'The anonymous proxy allows GraphQL queries only; mutations and subscriptions are not allowed.',
        )
      }
      operations.push(definition)
      continue
    }
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      if (fragments.has(definition.name.value)) {
        throw new GithubGraphqlValidationError(
          `Fragment ${definition.name.value} is defined more than once.`,
        )
      }
      fragments.set(definition.name.value, definition)
      continue
    }
    throw new GithubGraphqlValidationError(
      'The request contains a non-executable GraphQL definition.',
    )
  }

  if (operations.length === 0) {
    throw new GithubGraphqlValidationError('The GraphQL request must contain a query operation.')
  }

  const operation = selectOperation(operations, payload.operationName)
  const defaults = readVariableDefaults(operation.variableDefinitions)
  const stats = { fields: 0, maxDepth: 0 }
  inspectSelectionSet(
    operation.selectionSet,
    0,
    fragments,
    payload.variables || {},
    defaults,
    new Set(),
    stats,
  )

  if (stats.fields > MAX_FIELD_COUNT) {
    throw new GithubGraphqlValidationError(
      `The GraphQL query cannot contain more than ${MAX_FIELD_COUNT} fields.`,
    )
  }
  if (stats.maxDepth > MAX_QUERY_DEPTH) {
    throw new GithubGraphqlValidationError(
      `The GraphQL query depth cannot exceed ${MAX_QUERY_DEPTH}.`,
    )
  }
}

function selectOperation(
  operations: OperationDefinitionNode[],
  operationName: string | null | undefined,
) {
  if (operationName) {
    const selected = operations.find((operation) => operation.name?.value === operationName)
    if (!selected) {
      throw new GithubGraphqlValidationError(`No GraphQL query named ${operationName} was found.`)
    }
    return selected
  }
  if (operations.length !== 1) {
    throw new GithubGraphqlValidationError(
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
  depth: number,
  fragments: Map<string, FragmentDefinitionNode>,
  variables: Record<string, unknown>,
  defaults: Map<string, ValueNode>,
  activeFragments: Set<string>,
  stats: { fields: number; maxDepth: number },
) {
  for (const selection of selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      const fieldDepth = depth + 1
      stats.fields += 1
      stats.maxDepth = Math.max(stats.maxDepth, fieldDepth)
      if (stats.fields > MAX_FIELD_COUNT) {
        throw new GithubGraphqlValidationError(
          `The GraphQL query cannot contain more than ${MAX_FIELD_COUNT} fields.`,
        )
      }
      if (fieldDepth > MAX_QUERY_DEPTH) {
        throw new GithubGraphqlValidationError(
          `The GraphQL query depth cannot exceed ${MAX_QUERY_DEPTH}.`,
        )
      }
      inspectPaginationArguments(selection.arguments || [], variables, defaults)
      if (selection.selectionSet) {
        inspectSelectionSet(
          selection.selectionSet,
          fieldDepth,
          fragments,
          variables,
          defaults,
          activeFragments,
          stats,
        )
      }
      continue
    }

    if (selection.kind === Kind.INLINE_FRAGMENT) {
      inspectSelectionSet(
        selection.selectionSet,
        depth,
        fragments,
        variables,
        defaults,
        activeFragments,
        stats,
      )
      continue
    }

    const fragmentName = selection.name.value
    const fragment = fragments.get(fragmentName)
    if (!fragment) {
      throw new GithubGraphqlValidationError(`Fragment ${fragmentName} was not found.`)
    }
    if (activeFragments.has(fragmentName)) {
      throw new GithubGraphqlValidationError(
        `Fragment ${fragmentName} contains a cyclic reference.`,
      )
    }
    if (activeFragments.size >= MAX_FRAGMENT_HOPS) {
      throw new GithubGraphqlValidationError(
        `GraphQL fragment nesting cannot exceed ${MAX_FRAGMENT_HOPS} levels.`,
      )
    }

    const nextActiveFragments = new Set(activeFragments)
    nextActiveFragments.add(fragmentName)
    inspectSelectionSet(
      fragment.selectionSet,
      depth,
      fragments,
      variables,
      defaults,
      nextActiveFragments,
      stats,
    )
  }
}

function inspectPaginationArguments(
  args: readonly { name: { value: string }; value: ValueNode }[],
  variables: Record<string, unknown>,
  defaults: Map<string, ValueNode>,
) {
  for (const argument of args) {
    if (argument.name.value !== 'first' && argument.name.value !== 'last') {
      continue
    }
    const value = resolveInteger(argument.value, variables, defaults)
    if (value !== undefined && (!Number.isInteger(value) || value < 1 || value > MAX_PAGE_SIZE)) {
      throw new GithubGraphqlValidationError(
        `${argument.name.value} must be an integer between 1 and ${MAX_PAGE_SIZE}.`,
      )
    }
  }
}

function resolveInteger(
  value: ValueNode,
  variables: Record<string, unknown>,
  defaults: Map<string, ValueNode>,
): number | undefined {
  if (value.kind === Kind.INT) {
    return Number.parseInt(value.value, 10)
  }
  if (value.kind !== Kind.VARIABLE) {
    return undefined
  }

  const name = value.name.value
  if (Object.hasOwn(variables, name)) {
    const variable = variables[name]
    if (typeof variable !== 'number') {
      throw new GithubGraphqlValidationError(`Variable ${name} must be an integer.`)
    }
    return variable
  }

  const defaultValue = defaults.get(name)
  return defaultValue ? resolveInteger(defaultValue, variables, defaults) : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
