import { defineEventHandler } from 'h3'
import {
  getGithubRepositoryPath,
  proxyGithubRequest,
} from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'listGithubRepositoryReleases',
    tags: ['GitHub 仓库'],
    summary: '列出仓库版本',
    description: '返回 GitHub 公共仓库已发布的版本。',
    externalDocs: {
      description: 'GitHub REST API 文档',
      url: 'https://docs.github.com/rest/releases/releases#list-releases',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      { $ref: '#/components/parameters/GithubPerPage' },
      { $ref: '#/components/parameters/GithubPage' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: '版本列表。',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                required: ['id', 'tag_name', 'draft', 'prerelease'],
                properties: {
                  id: { type: 'integer' },
                  tag_name: { type: 'string' },
                  target_commitish: { type: 'string' },
                  name: { type: ['string', 'null'] },
                  body: { type: ['string', 'null'] },
                  draft: { type: 'boolean' },
                  prerelease: { type: 'boolean' },
                  immutable: { type: 'boolean' },
                  created_at: { type: 'string', format: 'date-time' },
                  published_at: { type: ['string', 'null'], format: 'date-time' },
                  html_url: { type: 'string', format: 'uri' },
                  tarball_url: { type: ['string', 'null'], format: 'uri' },
                  zipball_url: { type: ['string', 'null'], format: 'uri' },
                  assets: {
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
    path: getGithubRepositoryPath(event, 'releases'),
    resource: 'core',
  })
})
