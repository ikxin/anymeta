import { defineEventHandler } from 'h3'
import { proxyPypiRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['PyPI Updates'],
    summary: 'Get latest releases feed',
    description: 'Returns the original XML RSS feed of the latest releases across PyPI.',
    'x-docs': {
      platform: 'pypi',
      category: 'feeds',
      endpoint: 'updates',
      order: 440,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['PyPI 更新订阅'],
        summary: '获取最新版本更新订阅',
        description: '返回 PyPI 全站最新发行版本的原始 XML RSS 订阅。',
      },
      'zh-TW': {
        tags: ['PyPI 更新訂閱'],
        summary: '取得最新版本更新訂閱',
        description: '傳回 PyPI 全站最新發行版本的原始 XML RSS 訂閱。',
      },
      ja: {
        tags: ['PyPI 更新フィード'],
        summary: '最新リリースのフィードを取得',
        description: 'PyPI 全体の最新リリースの元の XML RSS フィードを返します。',
      },
      ko: {
        tags: ['PyPI 업데이트 구독'],
        summary: '최신 릴리스 업데이트 구독 조회',
        description: 'PyPI 전체 최신 릴리스의 원본 XML RSS 피드를 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.pypi.org/api/feeds/#latest-updates-feed' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'The original upstream response.',
        'x-i18n': {
          'zh-CN': { description: '上游原始响应。' },
          'zh-TW': { description: '上游原始回應。' },
          ja: { description: '上流の元のレスポンス。' },
          ko: { description: '업스트림 원본 응답.' },
        },
        content: { 'application/rss+xml': { schema: { type: 'string' } } },
      },
      304: { $ref: '#/components/responses/PypiNotModified' },
      default: { $ref: '#/components/responses/PypiError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyPypiRequest(event, {
    path: 'rss/updates.xml',
    accept: 'application/rss+xml',
  })
})
