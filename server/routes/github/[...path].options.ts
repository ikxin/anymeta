import { defineEventHandler, sendNoContent } from 'h3'

defineRouteMeta({
  openAPI: {
    operationId: 'githubOptions',
    tags: ['GitHub'],
    summary: '处理 GitHub 代理跨域预检',
    security: [],
    responses: {
      204: {
        description: '跨域预检请求已接受。',
      },
    },
  },
})

export default defineEventHandler(event => {
  return sendNoContent(event, 204)
})
