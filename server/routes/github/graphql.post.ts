import { createError, defineEventHandler, readRawBody } from 'h3'
import {
  GithubGraphqlValidationError,
  validateGithubGraphqlBody,
} from '#server/utils/github-graphql'
import { proxyGithubRequest } from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'githubGraphql',
    tags: ['GitHub GraphQL'],
    summary: '执行 GitHub GraphQL 查询',
    description: '使用共享 GitHub App 安装令牌执行只读 GraphQL 查询。',
    externalDocs: {
      description: 'GitHub GraphQL API 文档',
      url: 'https://docs.github.com/graphql',
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
                description: '只允许 query 操作，不允许 mutation 或 subscription。',
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
        },
      },
    },
    responses: {
      200: {
        description: 'GitHub GraphQL 响应。',
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
              $ref: '#/components/schemas/GithubProxyError',
            },
          },
        },
      },
      default: {
        description: 'GitHub 上游或 AnyMeta 返回的错误。',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/GithubProxyError',
            },
          },
        },
      },
    },
    $global: {
      components: {
        parameters: {
          GithubOwner: {
            name: 'owner',
            in: 'path',
            required: true,
            description: '仓库所有者账号名，不区分大小写。',
            schema: {
              type: 'string',
            },
            example: 'unjs',
          },
          GithubRepository: {
            name: 'repo',
            in: 'path',
            required: true,
            description: '不带 .git 后缀的仓库名称，不区分大小写。',
            schema: {
              type: 'string',
            },
            example: 'ungh',
          },
          GithubPage: {
            name: 'page',
            in: 'query',
            description: '要读取的结果页码。',
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1,
            },
          },
          GithubPerPage: {
            name: 'per_page',
            in: 'query',
            description: '每页返回的结果数量。',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 30,
            },
          },
          IfNoneMatch: {
            name: 'If-None-Match',
            in: 'header',
            description: '用于条件请求的 ETag。',
            schema: {
              type: 'string',
            },
          },
          IfModifiedSince: {
            name: 'If-Modified-Since',
            in: 'header',
            description: '用于条件请求的 HTTP 日期。',
            schema: {
              type: 'string',
            },
          },
        },
        schemas: {
          GithubProxyError: {
            type: 'object',
            description: 'GitHub 上游错误或 AnyMeta 代理错误。',
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
              documentation_url: {
                type: 'string',
                format: 'uri',
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
    body = validateGithubGraphqlBody(await readRawBody(event, 'utf8'))
  } catch (error) {
    if (error instanceof GithubGraphqlValidationError) {
      throw createError({ statusCode: 400, message: error.message })
    }
    throw error
  }

  return proxyGithubRequest(event, {
    path: 'graphql',
    resource: 'graphql',
    method: 'POST',
    body,
    contentType: 'application/json',
  })
})
