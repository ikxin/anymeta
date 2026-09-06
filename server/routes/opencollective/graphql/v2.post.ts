import { createError, defineEventHandler, readRawBody } from 'h3'
import {
  OpenCollectiveGraphqlValidationError,
  validateOpenCollectiveGraphqlBody,
} from '#server/utils/opencollective-graphql'
import { proxyOpenCollectiveGraphql } from '#server/utils/opencollective-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'openCollectiveGraphql',
    tags: ['OpenCollective GraphQL'],
    summary: 'Query public OpenCollective sponsorship metadata',
    description: 'Queries public Collective, member, tier, and amount metadata with a server-side Personal Token. Only allowlisted query fields are available; mutations, identity data, and payment data are rejected. When no Personal Token is configured, the OpenCollective anonymous allowance is used.',
    externalDocs: {
      description: 'OpenCollective GraphQL API documentation',
      url: 'https://developers.opencollective.com/access',
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
                description: 'Only public collective, members, tier, account, and amount fields can be queried.',
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
          example: {
            query: 'query Members($slug: String!) { collective(slug: $slug) { members(limit: 100, role: [BACKER]) { totalCount nodes { account { name slug website imageUrl } tier { name amount { value currency } } } } } }',
            variables: {
              slug: 'nuxtjs',
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'OpenCollective GraphQL response.',
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
              $ref: '#/components/schemas/OpenCollectiveProxyError',
            },
          },
        },
      },
      default: {
        description: 'OpenCollective or AnyMeta returned an error.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/OpenCollectiveProxyError',
            },
          },
        },
      },
    },
    $global: {
      components: {
        schemas: {
          OpenCollectiveProxyError: {
            type: 'object',
            description: 'An OpenCollective upstream error or an AnyMeta proxy error.',
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
    body = validateOpenCollectiveGraphqlBody(await readRawBody(event, 'utf8'))
  } catch (error) {
    if (error instanceof OpenCollectiveGraphqlValidationError) {
      throw createError({ statusCode: 400, message: error.message })
    }
    throw error
  }

  return proxyOpenCollectiveGraphql(event, body)
})
