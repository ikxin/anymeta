import type { OpenApiDocument } from '~/utils/openapi'

type OpenApiNode = Record<string, unknown>
type NodeVisitor = (value: unknown) => unknown

function isRecord(value: unknown): value is OpenApiNode {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

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
      if (Array.isArray(result.tags) && Array.isArray(translated.tags) && translated.tags.every(tag => typeof tag === 'string')) {
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
      properties: value => map(value, schema),
      patternProperties: value => map(value, schema),
      $defs: value => map(value, schema),
      definitions: value => map(value, schema),
      dependentSchemas: value => map(value, schema),
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
      allOf: value => list(value, schema),
      anyOf: value => list(value, schema),
      oneOf: value => list(value, schema),
      prefixItems: value => list(value, schema),
      externalDocs: metadata,
    })
  }

  const content: NodeVisitor = value => map(value, value => node(value, { schema }))
  const parameter: NodeVisitor = value => node(value, { schema, content })
  const requestBody: NodeVisitor = value => node(value, { content })
  const response: NodeVisitor = value => node(value, {
    content,
    headers: value => map(value, parameter),
    links: value => map(value, value => node(value, { server: metadata })),
  })
  const callbacks: NodeVisitor = value => map(value, value => map(value, pathItem))
  const operation: NodeVisitor = value => node(value, {
    parameters: value => list(value, parameter),
    requestBody,
    responses: value => map(value, response),
    callbacks,
    externalDocs: metadata,
    servers: value => list(value, metadata),
  })

  function pathItem(value: unknown): unknown {
    return node(value, {
      ...Object.fromEntries(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].map(method => [method, operation])),
      parameters: value => list(value, parameter),
      servers: value => list(value, metadata),
    })
  }

  return node(document, {
    info: metadata,
    paths: value => map(value, pathItem),
    webhooks: value => map(value, pathItem),
    tags: value => list(value, value => node(value, { externalDocs: metadata })),
    servers: value => list(value, metadata),
    externalDocs: metadata,
    components: value => node(value, {
      schemas: value => map(value, schema),
      parameters: value => map(value, parameter),
      headers: value => map(value, parameter),
      requestBodies: value => map(value, requestBody),
      responses: value => map(value, response),
      securitySchemes: value => map(value, metadata),
      links: value => map(value, value => node(value, { server: metadata })),
      callbacks,
      pathItems: value => map(value, pathItem),
    }),
  }) as OpenApiDocument
}
