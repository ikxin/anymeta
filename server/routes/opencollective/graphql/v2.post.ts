import { createError, defineEventHandler, readRawBody } from 'h3'
import {
  OpenCollectiveGraphqlValidationError,
  validateOpenCollectiveGraphqlBody,
} from '#server/utils/opencollective-graphql'
import { proxyOpenCollectiveGraphql } from '#server/utils/opencollective-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'openCollectiveGraphql',
    tags: ['OpenCollective GraphQL'],
    summary: '查询 OpenCollective 公开赞助元数据',
    description: '使用服务端 Personal Token 查询公开的 Collective、成员、赞助层级和金额元数据。只允许白名单内的 query 字段，不允许 mutation、身份数据或付款数据。未配置 Personal Token 时使用 OpenCollective 匿名额度。',
    externalDocs: {
      description: 'OpenCollective GraphQL API 文档',
      url: 'https://developers.opencollective.com/',
    },
    security: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['query'],
            additionalProperties: true,
            properties: {
              query: {
                type: 'string',
                description: '只允许查询公开的 collective、members、tier、account 和金额字段。',
              },
              operationName: {
                type: ['string', 'null'],
              },
              variables: {
                type: ['object', 'null'],
                additionalProperties: true,
              },
            },
          },
          example: {
            query: 'query Members($slug: String!) { collective(slug: $slug) { members(limit: 100, role: [BACKER]) { totalCount nodes { account { name slug website imageUrl } tier { name amount { value currency } } } } } }',
            variables: {
              slug: 'nuxtjs',
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'OpenCollective GraphQL 响应。',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              properties: {
                data: {
                  type: ['object', 'null'],
                  additionalProperties: true,
                },
                errors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: true,
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: '请求体或 GraphQL 查询不符合匿名代理限制。',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/OpenCollectiveProxyError',
            },
          },
        },
      },
      default: {
        description: 'OpenCollective 上游或 AnyMeta 返回的错误。',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/OpenCollectiveProxyError',
            },
          },
        },
      },
    },
    $global: {
      components: {
        schemas: {
          OpenCollectiveProxyError: {
            type: 'object',
            description: 'OpenCollective 上游错误或 AnyMeta 代理错误。',
            additionalProperties: true,
            properties: {
              message: {
                type: 'string',
              },
              statusCode: {
                type: 'integer',
              },
              statusMessage: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async event => {
  let body: string
  try {
    body = validateOpenCollectiveGraphqlBody(await readRawBody(event, 'utf8'))
  } catch (error) {
    if (error instanceof OpenCollectiveGraphqlValidationError) {
      throw createError({ statusCode: 400, message: error.message })
    }
    throw error
  }

  return proxyOpenCollectiveGraphql(event, body)
})
