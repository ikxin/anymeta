export interface ApiLocalizedMetadata {
  'x-i18n'?: Record<
    string,
    {
      title?: string
      summary?: string
      description?: string
      tags?: string[]
    }
  >
}

export interface ApiSchema extends ApiLocalizedMetadata {
  $ref?: string
  title?: string
  description?: string
  type?: string | string[]
  format?: string
  nullable?: boolean
  enum?: unknown[]
  const?: unknown
  example?: unknown
  examples?: unknown[]
  default?: unknown
  properties?: Record<string, ApiSchema>
  required?: string[]
  items?: ApiSchema
  additionalProperties?: boolean | ApiSchema
  oneOf?: ApiSchema[]
  anyOf?: ApiSchema[]
  allOf?: ApiSchema[]
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number | boolean
  exclusiveMaximum?: number | boolean
  minItems?: number
  maxItems?: number
  readOnly?: boolean
  writeOnly?: boolean
  deprecated?: boolean
  [key: string]: unknown
}

interface ApiReference extends ApiLocalizedMetadata {
  $ref: string
  description?: string
}

interface ApiExample {
  $ref?: string
  summary?: string
  description?: string
  value?: unknown
  externalValue?: string
}

export interface ApiParameter extends ApiLocalizedMetadata {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required?: boolean
  description?: string
  schema?: ApiSchema
  example?: unknown
  examples?: Record<string, ApiExample>
  deprecated?: boolean
  style?: string
  explode?: boolean
}

export interface ApiMediaType {
  schema?: ApiSchema
  example?: unknown
  examples?: Record<string, ApiExample>
}

export interface ApiResponse extends ApiLocalizedMetadata {
  description?: string
  content?: Record<string, ApiMediaType>
}

interface ApiRequestBody extends ApiLocalizedMetadata {
  required?: boolean
  description?: string
  content: Record<string, ApiMediaType>
}

interface ApiExternalDocs extends ApiLocalizedMetadata {
  description?: string
  url: string
}

interface ApiOperationDefinition extends ApiLocalizedMetadata {
  operationId?: string
  tags?: string[]
  summary?: string
  description?: string
  parameters?: (ApiParameter | ApiReference)[]
  requestBody?: ApiRequestBody | ApiReference
  responses?: Record<string, ApiResponse | ApiReference>
  externalDocs?: ApiExternalDocs
}

type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'

type ApiPathItem = Partial<Record<HttpMethod, ApiOperationDefinition>> &
  ApiLocalizedMetadata & {
    $ref?: string
    summary?: string
    description?: string
    parameters?: (ApiParameter | ApiReference)[]
  }

export interface OpenApiDocument {
  openapi?: string
  info?: {
    title?: string
    description?: string
    version?: string
    [key: string]: unknown
  }
  paths?: Record<string, ApiPathItem>
  tags?: { name: string; description?: string; externalDocs?: ApiExternalDocs }[]
  servers?: { url: string; description?: string }[]
  externalDocs?: ApiExternalDocs
  components?: {
    schemas?: Record<string, ApiSchema>
    parameters?: Record<string, ApiParameter | ApiReference>
    requestBodies?: Record<string, ApiRequestBody | ApiReference>
    responses?: Record<string, ApiResponse | ApiReference>
    examples?: Record<string, ApiExample>
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface ApiOperationRoute {
  platform: string
  category: string
  endpoint: string
}

export interface ApiOperation extends ApiOperationRoute {
  id: string
  method: Uppercase<HttpMethod>
  path: string
  tag: string
  summary: string
  description: string
  parameters: ApiParameter[]
  requestBody?: ApiRequestBody
  responses: Record<string, ApiResponse>
  externalDocs?: ApiExternalDocs
}

const httpMethods: HttpMethod[] = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
]
const parameterLocations = new Set(['path', 'query', 'header', 'cookie'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function localReference(document: OpenApiDocument, reference: string): unknown {
  if (!reference.startsWith('#/')) return undefined

  let pointer: string
  try {
    pointer = decodeURIComponent(reference.slice(2))
  } catch {
    return undefined
  }

  let value: unknown = document
  for (const segment of pointer.split('/')) {
    const key = segment.replace(/~1/g, '/').replace(/~0/g, '~')
    if (Array.isArray(value)) {
      if (!/^(0|[1-9]\d*)$/.test(key) || !Object.prototype.hasOwnProperty.call(value, key))
        return undefined
      value = value[Number(key)]
    } else {
      if (!isRecord(value) || !Object.prototype.hasOwnProperty.call(value, key)) return undefined
      value = value[key]
    }
  }
  return value
}

function resolveObject(
  document: OpenApiDocument,
  value: unknown,
): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined

  let resolved = { ...value }
  const visited = new Set<string>()
  while (typeof resolved.$ref === 'string' && visited.size < 64) {
    const reference = resolved.$ref
    if (visited.has(reference)) break
    visited.add(reference)

    const target = localReference(document, reference)
    if (!isRecord(target)) break

    const overrides = { ...resolved }
    delete overrides.$ref
    resolved = { ...target, ...overrides }
  }
  return resolved
}

export function resolveSchema(document: OpenApiDocument, schema: ApiSchema): ApiSchema {
  return (resolveObject(document, schema) ?? {}) as ApiSchema
}

function firstExample(document: OpenApiDocument, examples: unknown): unknown {
  if (!isRecord(examples)) return undefined
  for (const example of Object.values(examples)) {
    const resolved = resolveObject(document, example)
    if (resolved?.value !== undefined) return resolved.value
  }
  return undefined
}

function resolveParameter(document: OpenApiDocument, value: unknown): ApiParameter | undefined {
  const resolved = resolveObject(document, value)
  if (
    !resolved ||
    typeof resolved.name !== 'string' ||
    typeof resolved.in !== 'string' ||
    !parameterLocations.has(resolved.in)
  )
    return undefined

  const parameter = resolved as unknown as ApiParameter
  return {
    ...parameter,
    required: parameter.in === 'path' || parameter.required,
    schema: parameter.schema ? resolveSchema(document, parameter.schema) : undefined,
    example:
      parameter.example !== undefined
        ? parameter.example
        : firstExample(document, parameter.examples),
  }
}

function operationRoute(path: string, method: HttpMethod): ApiOperationRoute {
  let [platform = 'other', category = 'general', ...endpoints] = path
    .split('/')
    .filter((segment) => segment && !segment.includes('{'))

  if (platform === 'github' && category === 'repos' && endpoints[0] === 'releases') {
    category = 'releases'
    endpoints = endpoints.slice(1)
  }

  let endpoint = endpoints.join('-')
  if (!endpoint) {
    if (category === 'graphql' && method === 'post') endpoint = 'query'
    else if (category === 'releases' && method === 'get') endpoint = 'list'
    else endpoint = method
  }

  return { platform, category, endpoint }
}

export function getOperations(document: OpenApiDocument): ApiOperation[] {
  const operations: ApiOperation[] = []
  for (const [path, value] of Object.entries(document.paths ?? {})) {
    const pathItem = resolveObject(document, value)
    if (!pathItem || !path.startsWith('/')) continue

    for (const method of httpMethods) {
      const definition = pathItem[method]
      if (!isRecord(definition)) continue
      const operation = definition as ApiOperationDefinition
      if (!operation.operationId && !operation.summary) continue
      const parameters = new Map<string, ApiParameter>()
      const inherited = Array.isArray(pathItem.parameters) ? pathItem.parameters : []
      const own = Array.isArray(operation.parameters) ? operation.parameters : []

      for (const value of [...inherited, ...own]) {
        const parameter = resolveParameter(document, value)
        if (parameter) {
          const name = parameter.in === 'header' ? parameter.name.toLowerCase() : parameter.name
          parameters.set(`${parameter.in}:${name}`, parameter)
        }
      }

      for (const match of path.matchAll(/\{([^{}]+)\}/g)) {
        const name = match[1]
        if (name && !parameters.has(`path:${name}`)) {
          parameters.set(`path:${name}`, {
            name,
            in: 'path',
            required: true,
            schema: { type: 'string' },
          })
        }
      }

      const responses: Record<string, ApiResponse> = {}
      for (const [status, response] of Object.entries(operation.responses ?? {})) {
        const resolved = resolveObject(document, response)
        if (resolved) responses[status] = resolved as ApiResponse
      }

      const body = resolveObject(document, operation.requestBody)
      const requestBody =
        body && isRecord(body.content) ? (body as unknown as ApiRequestBody) : undefined
      operations.push({
        id: operation.operationId || `${method}:${path}`,
        ...operationRoute(path, method),
        method: method.toUpperCase() as Uppercase<HttpMethod>,
        path,
        tag: operation.tags?.[0] || path.split('/').filter(Boolean)[0] || 'Other endpoints',
        summary: operation.summary || path,
        description: operation.description || '',
        parameters: [...parameters.values()],
        requestBody,
        responses,
        externalDocs: operation.externalDocs,
      })
    }
  }
  return operations
}

function exampleForSchema(
  document: OpenApiDocument,
  input: ApiSchema,
  depth: number,
  references: Set<string>,
): unknown {
  if (depth > 8) return null
  const schema = resolveSchema(document, input)
  if (schema.example !== undefined) return schema.example
  if (schema.examples?.length) return schema.examples[0]
  if (schema.default !== undefined) return schema.default
  if (schema.enum?.length) return schema.enum[0]
  if (schema.const !== undefined) return schema.const

  if (input.$ref && references.has(input.$ref)) return null
  const visited = new Set(references)
  if (input.$ref) visited.add(input.$ref)
  const childExample = (child: ApiSchema) => exampleForSchema(document, child, depth + 1, visited)

  const alternatives = schema.oneOf ?? schema.anyOf
  if (alternatives?.length) {
    const choice =
      alternatives.find((item) => resolveSchema(document, item).type !== 'null') ?? alternatives[0]
    if (choice) return childExample(choice)
  }

  let combined: unknown
  for (const part of schema.allOf ?? []) {
    const example = childExample(part)
    combined = isRecord(combined) && isRecord(example) ? { ...combined, ...example } : example
  }

  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : []
  const type = types.find((value) => value !== 'null') ?? types[0]
  if (type === 'object' || schema.properties || schema.additionalProperties !== undefined) {
    const object: Record<string, unknown> = isRecord(combined) ? { ...combined } : {}
    for (const [name, property] of Object.entries(schema.properties ?? {})) {
      Object.defineProperty(object, name, {
        value: childExample(property),
        enumerable: true,
        configurable: true,
        writable: true,
      })
    }
    for (const name of schema.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(object, name)) {
        Object.defineProperty(object, name, {
          value: null,
          enumerable: true,
          configurable: true,
          writable: true,
        })
      }
    }
    if (!Object.keys(object).length && isRecord(schema.additionalProperties)) {
      object.additionalProperty = childExample(schema.additionalProperties)
    }
    return object
  }
  if (type === 'array' || schema.items) {
    if (schema.maxItems === 0) return []
    return schema.items ? [childExample(schema.items)] : []
  }
  if (combined !== undefined) return combined
  if (type === 'integer' || type === 'number') {
    let value = schema.minimum ?? 0
    if (typeof schema.exclusiveMinimum === 'number') value = schema.exclusiveMinimum + 1
    else if (schema.exclusiveMinimum === true) value += 1
    if (schema.maximum !== undefined) value = Math.min(value, schema.maximum)
    if (typeof schema.exclusiveMaximum === 'number')
      value = Math.min(value, schema.exclusiveMaximum - 1)
    else if (schema.exclusiveMaximum === true && schema.maximum !== undefined)
      value = Math.min(value, schema.maximum - 1)
    return type === 'integer' ? Math.ceil(value) : value
  }
  if (type === 'boolean') return false
  if (type === 'null') return null
  if (type === 'string') {
    const formats: Record<string, string> = {
      date: '2026-01-01',
      'date-time': '2026-01-01T00:00:00Z',
      uri: 'https://example.com',
      url: 'https://example.com',
      email: 'user@example.com',
      uuid: '00000000-0000-4000-8000-000000000000',
      hostname: 'example.com',
      ipv4: '127.0.0.1',
      ipv6: '::1',
    }
    return (schema.format && formats[schema.format]) || 'string'
  }
  return null
}

export function schemaExample(document: OpenApiDocument, schema: ApiSchema): unknown {
  return exampleForSchema(document, schema, 0, new Set())
}

export function mediaExample(document: OpenApiDocument, media: ApiMediaType): unknown {
  if (media.example !== undefined) return media.example
  const example = firstExample(document, media.examples)
  if (example !== undefined) return example
  return media.schema ? schemaExample(document, media.schema) : undefined
}

export function parameterValue(parameter: ApiParameter): string {
  const value =
    parameter.example !== undefined
      ? parameter.example
      : parameter.schema?.example !== undefined
        ? parameter.schema.example
        : parameter.schema?.default
  if (value === undefined || value === null) return ''
  if (typeof value === 'object') return JSON.stringify(value) ?? ''
  return String(value)
}

function describeSchema(schema: ApiSchema, depth: number): string {
  if (depth > 8) return '…'
  let label: string
  if (schema.oneOf?.length || schema.anyOf?.length) {
    label = [
      ...new Set(
        (schema.oneOf ?? schema.anyOf ?? []).map((item) => describeSchema(item, depth + 1)),
      ),
    ].join(' | ')
  } else if (schema.allOf?.length) {
    label = [...new Set(schema.allOf.map((item) => describeSchema(item, depth + 1)))].join(' & ')
  } else {
    const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : []
    if (!types.length) {
      if (schema.properties || schema.additionalProperties !== undefined) types.push('object')
      else if (schema.items) types.push('array')
    }
    label = types
      .map((type) => {
        if (type !== 'array' || !schema.items) return type
        const itemType = describeSchema(schema.items, depth + 1)
        return `${/[|&]/.test(itemType) ? `(${itemType})` : itemType}[]`
      })
      .join(' | ')
    if (!label)
      label = schema.$ref?.split('/').pop()?.replace(/~1/g, '/').replace(/~0/g, '~') || 'unknown'
  }
  if (schema.nullable && !label.split(' | ').includes('null')) label += ' | null'
  return label
}

export function schemaType(schema: ApiSchema): string {
  return describeSchema(schema, 0)
}

type NodeVisitor = (value: unknown) => unknown

export function localizeOpenApi(document: OpenApiDocument, locale: string): OpenApiDocument {
  function metadata(value: unknown): unknown {
    if (!isRecord(value)) return value
    const result = { ...value }
    const translations = value['x-i18n']
    delete result['x-i18n']

    if (!isRecord(translations)) return result

    // 英文标准字段作为基础，仅覆盖允许本地化的展示文案。
    for (const language of locale === 'en' ? ['en'] : ['en', locale]) {
      const translated = translations[language]
      if (!isRecord(translated)) continue
      for (const key of ['title', 'summary', 'description']) {
        if (typeof result[key] === 'string' && typeof translated[key] === 'string') {
          result[key] = translated[key]
        }
      }
      if (
        Array.isArray(result.tags) &&
        Array.isArray(translated.tags) &&
        translated.tags.every((tag) => typeof tag === 'string')
      ) {
        result.tags = [...translated.tags]
      }
    }

    return result
  }

  function map(value: unknown, visit: NodeVisitor): unknown {
    if (!isRecord(value)) return value
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, visit(child)]))
  }

  function list(value: unknown, visit: NodeVisitor): unknown {
    return Array.isArray(value) ? value.map(visit) : value
  }

  function node(value: unknown, fields: Record<string, NodeVisitor>): unknown {
    const result = metadata(value)
    if (!isRecord(result)) return result
    for (const [key, visit] of Object.entries(fields)) {
      if (Object.prototype.hasOwnProperty.call(result, key)) result[key] = visit(result[key])
    }
    return result
  }

  // 只沿文档结构遍历，实例、默认值、枚举、示例与扩展对象保持原样。
  function schema(value: unknown): unknown {
    return node(value, {
      properties: (value) => map(value, schema),
      patternProperties: (value) => map(value, schema),
      $defs: (value) => map(value, schema),
      definitions: (value) => map(value, schema),
      dependentSchemas: (value) => map(value, schema),
      items: schema,
      additionalProperties: schema,
      unevaluatedProperties: schema,
      unevaluatedItems: schema,
      contains: schema,
      propertyNames: schema,
      not: schema,
      if: schema,
      then: schema,
      else: schema,
      allOf: (value) => list(value, schema),
      anyOf: (value) => list(value, schema),
      oneOf: (value) => list(value, schema),
      prefixItems: (value) => list(value, schema),
      externalDocs: metadata,
    })
  }

  const content: NodeVisitor = (value) => map(value, (value) => node(value, { schema }))
  const parameter: NodeVisitor = (value) => node(value, { schema, content })
  const requestBody: NodeVisitor = (value) => node(value, { content })
  const response: NodeVisitor = (value) =>
    node(value, {
      content,
      headers: (value) => map(value, parameter),
      links: (value) => map(value, (value) => node(value, { server: metadata })),
    })
  const callbacks: NodeVisitor = (value) => map(value, (value) => map(value, pathItem))
  const operation: NodeVisitor = (value) =>
    node(value, {
      parameters: (value) => list(value, parameter),
      requestBody,
      responses: (value) => map(value, response),
      callbacks,
      externalDocs: metadata,
      servers: (value) => list(value, metadata),
    })

  function pathItem(value: unknown): unknown {
    return node(value, {
      ...Object.fromEntries(
        ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].map((method) => [
          method,
          operation,
        ]),
      ),
      parameters: (value) => list(value, parameter),
      servers: (value) => list(value, metadata),
    })
  }

  return node(document, {
    info: metadata,
    paths: (value) => map(value, pathItem),
    webhooks: (value) => map(value, pathItem),
    tags: (value) => list(value, (value) => node(value, { externalDocs: metadata })),
    servers: (value) => list(value, metadata),
    externalDocs: metadata,
    components: (value) =>
      node(value, {
        schemas: (value) => map(value, schema),
        parameters: (value) => map(value, parameter),
        headers: (value) => map(value, parameter),
        requestBodies: (value) => map(value, requestBody),
        responses: (value) => map(value, response),
        securitySchemes: (value) => map(value, metadata),
        links: (value) => map(value, (value) => node(value, { server: metadata })),
        callbacks,
        pathItems: (value) => map(value, pathItem),
      }),
  }) as OpenApiDocument
}
