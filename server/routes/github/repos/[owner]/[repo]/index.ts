import { defineEventHandler } from 'h3'
import {
  getGithubRepositoryPath,
  proxyGithubRequest,
} from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'getGithubRepository',
    tags: ['GitHub 仓库'],
    summary: '获取仓库信息',
    description: '返回 GitHub 公共仓库的元数据。',
    externalDocs: {
      description: 'GitHub REST API 文档',
      url: 'https://docs.github.com/rest/repos/repos#get-a-repository',
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
        description: '仓库元数据。',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              required: ['id', 'name', 'full_name', 'private', 'owner', 'html_url', 'url'],
              properties: {
                id: { type: 'integer' },
                node_id: { type: 'string' },
                name: { type: 'string' },
                full_name: { type: 'string' },
                private: { type: 'boolean' },
                owner: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    login: { type: 'string' },
                    id: { type: 'integer' },
                    avatar_url: { type: 'string', format: 'uri' },
                    html_url: { type: 'string', format: 'uri' },
                  },
                },
                html_url: { type: 'string', format: 'uri' },
                url: { type: 'string', format: 'uri' },
                description: { type: ['string', 'null'] },
                fork: { type: 'boolean' },
                stargazers_count: { type: 'integer' },
                forks_count: { type: 'integer' },
                open_issues_count: { type: 'integer' },
                default_branch: { type: 'string' },
                topics: {
                  type: 'array',
                  items: { type: 'string' },
                },
                visibility: { type: 'string' },
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
    path: getGithubRepositoryPath(event),
    resource: 'core',
  })
})
