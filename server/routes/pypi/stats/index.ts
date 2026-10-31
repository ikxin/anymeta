import { defineEventHandler } from 'h3'
import { proxyPypiRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['PyPI Statistics'],
    summary: 'Get registry storage statistics',
    description:
      'Returns total distribution storage size and the 100 largest projects by stored bytes.',
    'x-docs': {
      platform: 'pypi',
      category: 'stats',
      endpoint: 'get',
      order: 420,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['PyPI 统计'],
        summary: '获取平台容量统计',
        description: '返回分发文件总存储容量和按存储字节数排序的前 100 个最大依赖包。',
      },
      'zh-TW': {
        tags: ['PyPI 統計'],
        summary: '取得平台容量統計',
        description: '傳回散布檔案總儲存容量和依儲存位元組數排序的前 100 個最大套件。',
      },
      ja: {
        tags: ['PyPI 統計'],
        summary: 'レジストリの容量統計を取得',
        description: '配布ファイルの総容量と保存バイト数が大きい上位 100 パッケージを返します。',
      },
      ko: {
        tags: ['PyPI 통계'],
        summary: '레지스트리 용량 통계 조회',
        description: '배포 파일 총 저장 용량과 저장 바이트 수 기준 상위 100개 패키지를 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.pypi.org/api/stats/#project-stats' },
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
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              properties: {
                total_packages_size: { type: 'integer', minimum: 0 },
                top_packages: {
                  type: 'object',
                  additionalProperties: {
                    type: 'object',
                    additionalProperties: true,
                    properties: { size: { type: 'integer', minimum: 0 } },
                  },
                },
              },
            },
          },
        },
      },
      304: { $ref: '#/components/responses/PypiNotModified' },
      default: { $ref: '#/components/responses/PypiError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyPypiRequest(event, {
    path: 'stats/',
  })
})
