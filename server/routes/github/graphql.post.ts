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
    summary: 'Run a GitHub GraphQL query',
    description: 'Runs a read-only GraphQL query with a shared GitHub App installation access token.',
    externalDocs: {
      description: 'GitHub GraphQL API documentation',
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
                description: 'Only query operations are allowed; mutations and subscriptions are rejected.',
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
        description: 'GitHub GraphQL response.',
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
        description: 'The request body or GraphQL query violates the anonymous proxy limits.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/GithubProxyError',
            },
          },
        },
      },
      default: {
        description: 'GitHub or AnyMeta returned an error.',
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
            description: 'The repository owner login. The value is case-insensitive.',
            schema: {
              type: 'string',
            },
            example: 'unjs',
          },
          GithubRepository: {
            name: 'repo',
            in: 'path',
            required: true,
            description: 'The repository name without the .git suffix. The value is case-insensitive.',
            schema: {
              type: 'string',
            },
            example: 'ungh',
          },
          GithubPage: {
            name: 'page',
            in: 'query',
            description: 'The page number to fetch.',
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1,
            },
          },
          GithubPerPage: {
            name: 'per_page',
            in: 'query',
            description: 'The number of results to return per page.',
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
            description: 'An ETag for conditional requests.',
            schema: {
              type: 'string',
            },
          },
          IfModifiedSince: {
            name: 'If-Modified-Since',
            in: 'header',
            description: 'An HTTP date for conditional requests.',
            schema: {
              type: 'string',
            },
          },
        },
        schemas: {
          GithubProxyError: {
            type: 'object',
            description: 'A GitHub upstream error or an AnyMeta proxy error.',
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
