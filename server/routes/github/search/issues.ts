import { defineEventHandler } from 'h3'
import { proxyGithubRequest } from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'searchGithubIssues',
    tags: ['GitHub Search'],
    summary: 'Search issues and pull requests',
    description: 'Find public issues and pull requests using GitHub search syntax.',
    externalDocs: {
      description: 'GitHub REST API documentation',
      url: 'https://docs.github.com/rest/search/search#search-issues-and-pull-requests',
    },
    security: [],
    parameters: [
      {
        name: 'q',
        in: 'query',
        required: true,
        description: 'A GitHub search query containing search terms and qualifiers.',
        schema: {
          type: 'string',
        },
        example: 'repo:unjs/ungh is:issue state:open',
      },
      {
        name: 'sort',
        in: 'query',
        description: 'The sort field, such as comments, reactions, interactions, created, or updated.',
        schema: {
          type: 'string',
        },
      },
      {
        name: 'order',
        in: 'query',
        description: 'The sort direction.',
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
        description: 'Search results.',
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
        description: 'Not modified.',
      },
      default: {
        description: 'The search parameters are invalid, the rate limit was reached, or GitHub or AnyMeta returned an error.',
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
