import { createError, defineEventHandler, setResponseHeader } from 'h3'

const graphqlMethodNotAllowed = defineEventHandler(event => {
  setResponseHeader(event, 'Allow', 'POST, OPTIONS')
  throw createError({
    statusCode: 405,
    message: 'GraphQL 接口只接受 POST 请求。',
  })
})

export default defineNitroPlugin(nitroApp => {
  nitroApp.router.use('/opencollective/graphql/v2', graphqlMethodNotAllowed, [
    'connect',
    'delete',
    'get',
    'head',
    'patch',
    'put',
    'trace',
  ])
})
