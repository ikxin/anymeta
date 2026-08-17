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
    throw new GithubGraphqlValidationError('GraphQL 请求体不能为空。')
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    throw new GithubGraphqlValidationError('GraphQL 请求体不能超过 64 KiB。')
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    throw new GithubGraphqlValidationError('GraphQL 请求体必须是有效的 JSON。')
  }
  if (!isRecord(payload) || typeof payload.query !== 'string' || !payload.query.trim()) {
    throw new GithubGraphqlValidationError('GraphQL 请求体必须包含非空的 query 字段。')
  }
  if (
    payload.operationName !== undefined &&
    payload.operationName !== null &&
    typeof payload.operationName !== 'string'
  ) {
    throw new GithubGraphqlValidationError('operationName 必须是字符串。')
  }
  if (
    payload.variables !== undefined &&
    payload.variables !== null &&
    !isRecord(payload.variables)
  ) {
    throw new GithubGraphqlValidationError('variables 必须是 JSON 对象。')
  }

  inspectDocument(payload as unknown as GithubGraphqlPayload)
  return rawBody
}

function inspectDocument(payload: GithubGraphqlPayload) {
  let document
  try {
    document = parse(payload.query)
  } catch (error) {
    const message = error instanceof Error ? error.message : '无法解析查询。'
    throw new GithubGraphqlValidationError(`GraphQL 语法错误：${message}`)
  }
  if (document.definitions.length > MAX_DEFINITION_COUNT) {
    throw new GithubGraphqlValidationError(
      `GraphQL 定义数量不能超过 ${MAX_DEFINITION_COUNT}。`,
    )
  }

  const operations: OperationDefinitionNode[] = []
  const fragments = new Map<string, FragmentDefinitionNode>()
  for (const definition of document.definitions) {
    if (definition.kind === Kind.OPERATION_DEFINITION) {
      if (definition.operation !== 'query') {
        throw new GithubGraphqlValidationError('匿名代理只允许 GraphQL 查询，不允许变更或订阅。')
      }
      operations.push(definition)
      continue
    }
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      if (fragments.has(definition.name.value)) {
        throw new GithubGraphqlValidationError(`片段 ${definition.name.value} 重复定义。`)
      }
      fragments.set(definition.name.value, definition)
      continue
    }
    throw new GithubGraphqlValidationError('请求中包含非可执行的 GraphQL 定义。')
  }

  if (operations.length === 0) {
    throw new GithubGraphqlValidationError('GraphQL 请求必须包含查询操作。')
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
      `GraphQL 查询字段数量不能超过 ${MAX_FIELD_COUNT}。`,
    )
  }
  if (stats.maxDepth > MAX_QUERY_DEPTH) {
    throw new GithubGraphqlValidationError(
      `GraphQL 查询深度不能超过 ${MAX_QUERY_DEPTH}。`,
    )
  }
}

function selectOperation(
  operations: OperationDefinitionNode[],
  operationName: string | null | undefined,
) {
  if (operationName) {
    const selected = operations.find(operation => operation.name?.value === operationName)
    if (!selected) {
      throw new GithubGraphqlValidationError(`找不到名为 ${operationName} 的 GraphQL 查询。`)
    }
    return selected
  }
  if (operations.length !== 1) {
    throw new GithubGraphqlValidationError('包含多个查询时必须提供 operationName。')
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
          `GraphQL 查询字段数量不能超过 ${MAX_FIELD_COUNT}。`,
        )
      }
      if (fieldDepth > MAX_QUERY_DEPTH) {
        throw new GithubGraphqlValidationError(
          `GraphQL 查询深度不能超过 ${MAX_QUERY_DEPTH}。`,
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
      throw new GithubGraphqlValidationError(`找不到片段 ${fragmentName}。`)
    }
    if (activeFragments.has(fragmentName)) {
      throw new GithubGraphqlValidationError(`片段 ${fragmentName} 存在循环引用。`)
    }
    if (activeFragments.size >= MAX_FRAGMENT_HOPS) {
      throw new GithubGraphqlValidationError(
        `GraphQL 片段嵌套不能超过 ${MAX_FRAGMENT_HOPS} 层。`,
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
        `${argument.name.value} 必须是 1 到 ${MAX_PAGE_SIZE} 之间的整数。`,
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
      throw new GithubGraphqlValidationError(`变量 ${name} 必须是整数。`)
    }
    return variable
  }

  const defaultValue = defaults.get(name)
  return defaultValue ? resolveInteger(defaultValue, variables, defaults) : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
