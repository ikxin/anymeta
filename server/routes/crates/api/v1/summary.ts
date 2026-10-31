import { defineEventHandler } from 'h3'
import { proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Overview'],
    summary: 'Get registry overview',
    description:
      'Returns total crates and downloads, recent and popular crates, keywords, and categories.',
    'x-docs': {
      platform: 'crates',
      category: 'summary',
      endpoint: 'get',
      order: 360,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 概览'],
        summary: '获取平台概览',
        description: '返回依赖包总数、总下载量、最新及热门依赖包、关键词和分类。',
      },
      'zh-TW': {
        tags: ['crates.io 概覽'],
        summary: '取得平台概覽',
        description: '傳回套件總數、總下載量、最新及熱門套件、關鍵字和分類。',
      },
      ja: {
        tags: ['crates.io 概要'],
        summary: 'レジストリの概要を取得',
        description: 'パッケージ総数とダウンロード総数、最新および人気のパッケージ、キーワード、カテゴリを返します。',
      },
      ko: {
        tags: ['crates.io 개요'],
        summary: '레지스트리 개요 조회',
        description: '패키지 총수와 다운로드 총수, 최신 및 인기 패키지, 키워드와 분류를 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/rust-lang/crates.io/blob/main/src/controllers/summary.rs',
    },
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
                num_crates: { type: 'integer', minimum: 0 },
                num_downloads: { type: 'integer', minimum: 0 },
                new_crates: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CratesPackage' },
                },
                most_downloaded: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CratesPackage' },
                },
                most_recently_downloaded: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CratesPackage' },
                },
                just_updated: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CratesPackage' },
                },
                popular_keywords: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CratesKeyword' },
                },
                popular_categories: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CratesCategory' },
                },
              },
            },
          },
        },
      },
      304: { $ref: '#/components/responses/CratesNotModified' },
      default: { $ref: '#/components/responses/CratesError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyCratesRequest(event, {
    path: 'api/v1/summary',
  })
})
