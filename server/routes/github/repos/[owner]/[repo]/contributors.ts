import { defineEventHandler } from 'h3'
import {
  getGithubRepositoryPath,
  proxyGithubRequest,
} from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'listGithubRepositoryContributors',
    tags: ['GitHub 仓库'],
    summary: '列出仓库贡献者',
    description: '按贡献次数降序返回 GitHub 公共仓库的贡献者。',
    externalDocs: {
      description: 'GitHub REST API 文档',
      url: 'https://docs.github.com/rest/repos/repos#list-repository-contributors',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'anon',
        in: 'query',
        description: '设置为 1 或 true 时包含匿名贡献者。',
        schema: {
          type: 'string',
          enum: ['1', 'true'],
        },
      },
      { $ref: '#/components/parameters/GithubPerPage' },
      { $ref: '#/components/parameters/GithubPage' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: '贡献者列表。',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                required: ['contributions'],
                properties: {
                  login: { type: 'string' },
                  id: { type: 'integer' },
                  avatar_url: { type: 'string', format: 'uri' },
                  html_url: { type: 'string', format: 'uri' },
                  type: { type: 'string' },
                  contributions: { type: 'integer', minimum: 0 },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
      204: {
        description: '仓库为空。',
      },
      304: {
        description: '条件请求命中，内容没有变化。',
      },
      default: {
        description: 'GitHub 上游或 AnyMeta 返回的错误。',
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
    path: getGithubRepositoryPath(event, 'contributors'),
    resource: 'core',
  })
})
