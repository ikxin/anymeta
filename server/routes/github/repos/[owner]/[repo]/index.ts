import { defineEventHandler } from 'h3'
import {
  getGithubRepositoryPath,
  proxyGithubRequest,
} from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'getGithubRepository',
    tags: ['GitHub Repository'],
    summary: 'Get a repository',
    description: 'Returns metadata for a public GitHub repository.',
    externalDocs: {
      description: 'GitHub REST API documentation',
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
        description: 'Repository metadata.',
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
        description: 'Not modified.',
      },
      default: {
        description: 'GitHub or AnyMeta returned an error.',
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
