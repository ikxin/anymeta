import { createError, defineEventHandler, setResponseHeader } from 'h3'

const graphqlMethodNotAllowed = defineEventHandler((event) => {
  setResponseHeader(event, 'Allow', 'POST, OPTIONS')
  throw createError({
    statusCode: 405,
    message: 'The GraphQL endpoint accepts POST requests only.',
  })
})

export default defineNitroPlugin((nitroApp) => {
  for (const path of ['/github/graphql', '/opencollective/graphql/v2']) {
    nitroApp.router.use(path, graphqlMethodNotAllowed, [
      'connect',
      'delete',
      'get',
      'head',
      'patch',
      'put',
      'trace',
    ])
  }
})
