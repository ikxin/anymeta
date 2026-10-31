import { defineEventHandler } from 'h3'
import { proxyPypiRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['PyPI Updates'],
    summary: 'Get newest projects feed',
    description: 'Returns the original XML RSS feed of newly created PyPI projects.',
    'x-docs': {
      platform: 'pypi',
      category: 'feeds',
      endpoint: 'packages',
      order: 430,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['PyPI 更新订阅'],
        summary: '获取最新依赖包订阅',
        description: '返回 PyPI 新建依赖包的原始 XML RSS 订阅。',
      },
      'zh-TW': {
        tags: ['PyPI 更新訂閱'],
        summary: '取得最新套件訂閱',
        description: '傳回 PyPI 新建套件的原始 XML RSS 訂閱。',
      },
      ja: {
        tags: ['PyPI 更新フィード'],
        summary: '新規パッケージのフィードを取得',
        description: '新しく登録された PyPI パッケージの元の XML RSS フィードを返します。',
      },
      ko: {
        tags: ['PyPI 업데이트 구독'],
        summary: '최신 패키지 구독 조회',
        description: '새로 등록된 PyPI 패키지의 원본 XML RSS 피드를 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.pypi.org/api/feeds/#newest-packages-feed' },
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
    path: 'rss/packages.xml',
    accept: 'application/rss+xml',
  })
})
