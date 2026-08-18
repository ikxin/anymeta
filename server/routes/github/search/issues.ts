import { defineEventHandler } from 'h3'
import { proxyGithubRequest } from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'searchGithubIssues',
    tags: ['GitHub 搜索'],
    summary: '搜索议题和拉取请求',
    description: '使用 GitHub 搜索语法查找公共议题和拉取请求。',
    externalDocs: {
      description: 'GitHub REST API 文档',
      url: 'https://docs.github.com/rest/search/search#search-issues-and-pull-requests',
    },
    security: [],
    parameters: [
      {
        name: 'q',
        in: 'query',
        required: true,
        description: '包含搜索词和限定符的 GitHub 搜索查询。',
        schema: {
          type: 'string',
        },
        example: 'repo:unjs/ungh is:issue state:open',
      },
      {
        name: 'sort',
        in: 'query',
        description: '排序字段，例如 comments、reactions、interactions、created 或 updated。',
        schema: {
          type: 'string',
        },
      },
      {
        name: 'order',
        in: 'query',
        description: '排序方向。',
        schema: {
          type: 'string',
          enum: ['desc', 'asc'],
          default: 'desc',
        },
      },
      { $ref: '#/components/parameters/GithubPerPage' },
      { $ref: '#/components/parameters/GithubPage' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: '搜索结果。',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              required: ['total_count', 'incomplete_results', 'items'],
              properties: {
                total_count: { type: 'integer', minimum: 0 },
                incomplete_results: { type: 'boolean' },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                      id: { type: 'integer' },
                      number: { type: 'integer' },
                      title: { type: 'string' },
                      state: { type: 'string' },
                      html_url: { type: 'string', format: 'uri' },
                      repository_url: { type: 'string', format: 'uri' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      304: {
        description: '条件请求命中，内容没有变化。',
      },
      default: {
        description: '搜索参数无效、额度受限，或者 GitHub 上游、AnyMeta 返回错误。',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/GithubProxyError' },
          },
        },
      },
    },
  },
})

export default defineEventHandler(event => {
  return proxyGithubRequest(event, {
    path: 'search/issues',
    resource: 'search',
  })
})
