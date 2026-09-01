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
const MAX_FIELD_COUNT = 300
const MAX_DEFINITION_COUNT = 100
const MAX_FRAGMENT_HOPS = 50
const MAX_PAGE_SIZE = 100
const MAX_OFFSET = 10_000
const MAX_IMAGE_SIZE = 1_024

type FieldPolicy = true | Readonly<Record<string, FieldPolicy>>

const amountFields = {
  value: true,
  currency: true,
  valueInCents: true,
} satisfies Readonly<Record<string, FieldPolicy>>

const accountFields = {
  id: true,
  legacyId: true,
  slug: true,
  name: true,
  type: true,
  description: true,
  website: true,
  imageUrl: true,
  isIncognito: true,
} satisfies Readonly<Record<string, FieldPolicy>>

const tierFields = {
  id: true,
  slug: true,
  name: true,
  type: true,
  description: true,
  amount: amountFields,
  endsAt: true,
  interval: true,
  frequency: true,
} satisfies Readonly<Record<string, FieldPolicy>>

const memberFields = {
  id: true,
  role: true,
  createdAt: true,
  since: true,
  totalDonations: amountFields,
  tier: tierFields,
  account: accountFields,
} satisfies Readonly<Record<string, FieldPolicy>>

const publicQueryFields: Readonly<Record<string, FieldPolicy>> = {
  collective: {
    ...accountFields,
    currency: true,
    members: {
      offset: true,
      limit: true,
      totalCount: true,
      nodes: memberFields,
    },
  },
}

interface OpenCollectiveGraphqlPayload {
  query: string
  operationName?: string | null
  variables?: Record<string, unknown> | null
}

export class OpenCollectiveGraphqlValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OpenCollectiveGraphqlValidationError'
  }
}

export function validateOpenCollectiveGraphqlBody(rawBody: string | undefined) {
  if (!rawBody) {
    throw new OpenCollectiveGraphqlValidationError('GraphQL 请求体不能为空。')
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    throw new OpenCollectiveGraphqlValidationError('GraphQL 请求体不能超过 64 KiB。')
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    throw new OpenCollectiveGraphqlValidationError('GraphQL 请求体必须是有效的 JSON。')
  }
  if (!isRecord(payload) || typeof payload.query !== 'string' || !payload.query.trim()) {
    throw new OpenCollectiveGraphqlValidationError('GraphQL 请求体必须包含非空的 query 字段。')
  }
  if (
    payload.operationName !== undefined &&
    payload.operationName !== null &&
    typeof payload.operationName !== 'string'
  ) {
    throw new OpenCollectiveGraphqlValidationError('operationName 必须是字符串。')
  }
  if (
    payload.variables !== undefined &&
    payload.variables !== null &&
    !isRecord(payload.variables)
  ) {
    throw new OpenCollectiveGraphqlValidationError('variables 必须是 JSON 对象。')
  }

  inspectDocument(payload as unknown as OpenCollectiveGraphqlPayload)
  return rawBody
}

function inspectDocument(payload: OpenCollectiveGraphqlPayload) {
  let document
  try {
    document = parse(payload.query)
  } catch (error) {
    const message = error instanceof Error ? error.message : '无法解析查询。'
    throw new OpenCollectiveGraphqlValidationError(`GraphQL 语法错误：${message}`)
  }
  if (document.definitions.length > MAX_DEFINITION_COUNT) {
    throw new OpenCollectiveGraphqlValidationError(
      `GraphQL 定义数量不能超过 ${MAX_DEFINITION_COUNT}。`,
    )
  }

  const operations: OperationDefinitionNode[] = []
  const fragments = new Map<string, FragmentDefinitionNode>()
  for (const definition of document.definitions) {
    if (definition.kind === Kind.OPERATION_DEFINITION) {
      if (definition.operation !== 'query') {
        throw new OpenCollectiveGraphqlValidationError(
          '匿名代理只允许 GraphQL 查询，不允许变更或订阅。',
        )
      }
      operations.push(definition)
      continue
    }
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      if (fragments.has(definition.name.value)) {
        throw new OpenCollectiveGraphqlValidationError(
          `片段 ${definition.name.value} 重复定义。`,
        )
      }
      fragments.set(definition.name.value, definition)
      continue
    }
    throw new OpenCollectiveGraphqlValidationError('请求中包含非可执行的 GraphQL 定义。')
  }

  if (operations.length === 0) {
    throw new OpenCollectiveGraphqlValidationError('GraphQL 请求必须包含查询操作。')
  }

  const operation = selectOperation(operations, payload.operationName)
  const defaults = readVariableDefaults(operation.variableDefinitions)
  const stats = { fields: 0, maxDepth: 0 }
  inspectSelectionSet(
    operation.selectionSet,
    publicQueryFields,
    [],
    fragments,
    payload.variables || {},
    defaults,
    new Set(),
    stats,
  )
}

function selectOperation(
  operations: OperationDefinitionNode[],
  operationName: string | null | undefined,
) {
  if (operationName) {
    const selected = operations.find(operation => operation.name?.value === operationName)
    if (!selected) {
      throw new OpenCollectiveGraphqlValidationError(
        `找不到名为 ${operationName} 的 GraphQL 查询。`,
      )
    }
    return selected
  }
  if (operations.length !== 1) {
    throw new OpenCollectiveGraphqlValidationError('包含多个查询时必须提供 operationName。')
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
  policy: Readonly<Record<string, FieldPolicy>>,
  path: string[],
  fragments: Map<string, FragmentDefinitionNode>,
  variables: Record<string, unknown>,
  defaults: Map<string, ValueNode>,
  activeFragments: Set<string>,
  stats: { fields: number; maxDepth: number },
) {
  for (const selection of selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      const fieldName = selection.name.value
      const fieldDepth = path.length + 1
      stats.fields += 1
      stats.maxDepth = Math.max(stats.maxDepth, fieldDepth)
      if (stats.fields > MAX_FIELD_COUNT) {
        throw new OpenCollectiveGraphqlValidationError(
          `GraphQL 查询字段数量不能超过 ${MAX_FIELD_COUNT}。`,
        )
      }
      if (fieldDepth > MAX_QUERY_DEPTH) {
        throw new OpenCollectiveGraphqlValidationError(
          `GraphQL 查询深度不能超过 ${MAX_QUERY_DEPTH}。`,
        )
      }

      if (fieldName === '__typename') {
        if (selection.selectionSet) {
          throw new OpenCollectiveGraphqlValidationError('__typename 不能包含子字段。')
        }
        continue
      }

      const fieldPolicy = policy[fieldName]
      const fieldPath = [...path, fieldName]
      if (!fieldPolicy) {
        throw new OpenCollectiveGraphqlValidationError(
          `匿名代理不允许查询字段 ${fieldPath.join('.')}。`,
        )
      }

      inspectBoundedArguments(selection.arguments || [], variables, defaults)
      if (selection.selectionSet) {
        if (fieldPolicy === true) {
          throw new OpenCollectiveGraphqlValidationError(
            `字段 ${fieldPath.join('.')} 不能包含子字段。`,
          )
        }
        inspectSelectionSet(
          selection.selectionSet,
          fieldPolicy,
          fieldPath,
          fragments,
          variables,
          defaults,
          activeFragments,
          stats,
        )
      } else if (fieldPolicy !== true) {
        throw new OpenCollectiveGraphqlValidationError(
          `字段 ${fieldPath.join('.')} 必须选择公开子字段。`,
        )
      }
      continue
    }

    if (selection.kind === Kind.INLINE_FRAGMENT) {
      inspectSelectionSet(
        selection.selectionSet,
        policy,
        path,
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
      throw new OpenCollectiveGraphqlValidationError(`找不到片段 ${fragmentName}。`)
    }
    if (activeFragments.has(fragmentName)) {
      throw new OpenCollectiveGraphqlValidationError(`片段 ${fragmentName} 存在循环引用。`)
    }
    if (activeFragments.size >= MAX_FRAGMENT_HOPS) {
      throw new OpenCollectiveGraphqlValidationError(
        `GraphQL 片段嵌套不能超过 ${MAX_FRAGMENT_HOPS} 层。`,
      )
    }

    const nextActiveFragments = new Set(activeFragments)
    nextActiveFragments.add(fragmentName)
    inspectSelectionSet(
      fragment.selectionSet,
      policy,
      path,
      fragments,
      variables,
      defaults,
      nextActiveFragments,
      stats,
    )
  }
}

function inspectBoundedArguments(
  args: readonly { name: { value: string }; value: ValueNode }[],
  variables: Record<string, unknown>,
  defaults: Map<string, ValueNode>,
) {
  const bounds: Record<string, { minimum: number; maximum: number }> = {
    limit: { minimum: 1, maximum: MAX_PAGE_SIZE },
    offset: { minimum: 0, maximum: MAX_OFFSET },
    height: { minimum: 1, maximum: MAX_IMAGE_SIZE },
    width: { minimum: 1, maximum: MAX_IMAGE_SIZE },
  }

  for (const argument of args) {
    const bound = bounds[argument.name.value]
    if (!bound) {
      continue
    }
    const value = resolveInteger(argument.value, variables, defaults, argument.name.value)
    if (
      value !== undefined &&
      (!Number.isInteger(value) || value < bound.minimum || value > bound.maximum)
    ) {
      throw new OpenCollectiveGraphqlValidationError(
        `${argument.name.value} 必须是 ${bound.minimum} 到 ${bound.maximum} 之间的整数。`,
      )
    }
  }
}

function resolveInteger(
  value: ValueNode,
  variables: Record<string, unknown>,
  defaults: Map<string, ValueNode>,
  argumentName: string,
): number | undefined {
  if (value.kind === Kind.INT) {
    return Number.parseInt(value.value, 10)
  }
  if (value.kind === Kind.NULL) {
    return undefined
  }
  if (value.kind !== Kind.VARIABLE) {
    throw new OpenCollectiveGraphqlValidationError(`${argumentName} 必须是整数。`)
  }

  const name = value.name.value
  if (Object.hasOwn(variables, name)) {
    const variable = variables[name]
    if (variable === null || variable === undefined) {
      return undefined
    }
    if (typeof variable !== 'number') {
      throw new OpenCollectiveGraphqlValidationError(`变量 ${name} 必须是整数。`)
    }
    return variable
  }

  const defaultValue = defaults.get(name)
  return defaultValue
    ? resolveInteger(defaultValue, variables, defaults, argumentName)
    : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
