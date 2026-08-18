import { defineEventHandler } from 'h3'
import {
  getGithubRepositoryPath,
  proxyGithubRequest,
} from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'listGithubRepositoryLanguages',
    tags: ['GitHub 仓库'],
    summary: '列出仓库语言',
    description: '返回每种编程语言对应的代码字节数。',
    externalDocs: {
      description: 'GitHub REST API 文档',
      url: 'https://docs.github.com/rest/repos/repos#list-repository-languages',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: '语言名称到代码字节数的映射。',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: {
                type: 'integer',
                minimum: 0,
              },
              example: {
                TypeScript: 78769,
                Vue: 7769,
              },
            },
          },
        },
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
    path: getGithubRepositoryPath(event, 'languages'),
    resource: 'core',
  })
})
