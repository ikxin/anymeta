import { defineEventHandler } from 'h3'
import {
  getGithubRepositoryPath,
  proxyGithubRequest,
} from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'listGithubRepositoryLanguages',
    tags: ['GitHub Repository'],
    summary: 'List repository languages',
    description: 'Returns the number of bytes of code written in each language.',
    externalDocs: {
      description: 'GitHub REST API documentation',
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
        description: 'A mapping of language names to the number of bytes of code.',
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
    path: getGithubRepositoryPath(event, 'languages'),
    resource: 'core',
  })
})
