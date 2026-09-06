import { defineEventHandler } from 'h3'
import {
  getGithubRepositoryPath,
  proxyGithubRequest,
} from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'listGithubRepositoryContributors',
    tags: ['GitHub Repository'],
    summary: 'List repository contributors',
    description: 'Lists contributors to a public GitHub repository, sorted by contribution count in descending order.',
    externalDocs: {
      description: 'GitHub REST API documentation',
      url: 'https://docs.github.com/rest/repos/repos#list-repository-contributors',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'anon',
        in: 'query',
        description: 'Set to 1 or true to include anonymous contributors.',
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
        description: 'Contributor list.',
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
        description: 'The repository is empty.',
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
    path: getGithubRepositoryPath(event, 'contributors'),
    resource: 'core',
  })
})
