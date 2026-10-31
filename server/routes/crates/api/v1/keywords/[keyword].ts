import { defineEventHandler } from 'h3'
import { getCratesTaxonomyPath, proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Keywords'],
    summary: 'Get keyword metadata',
    description: 'Returns keyword metadata and the associated crate count.',
    'x-docs': {
      platform: 'crates',
      category: 'keywords',
      endpoint: 'get',
      order: 350,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 关键词'],
        summary: '获取关键词信息',
        description: '返回关键词元数据及关联的依赖包数量。',
      },
      'zh-TW': {
        tags: ['crates.io 關鍵字'],
        summary: '取得關鍵字資訊',
        description: '傳回關鍵字中繼資料及關聯的套件數量。',
      },
      ja: {
        tags: ['crates.io キーワード'],
        summary: 'キーワード情報を取得',
        description: 'キーワードのメタデータと関連パッケージ数を返します。',
      },
      ko: {
        tags: ['crates.io 키워드'],
        summary: '키워드 정보 조회',
        description: '키워드 메타데이터와 관련 패키지 수를 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/rust-lang/crates.io/blob/main/src/controllers/keyword.rs',
    },
    security: [],
    parameters: [
      {
        name: 'keyword',
        in: 'path',
        required: true,
        description: 'The keyword.',
        'x-i18n': {
          'zh-CN': { description: '关键词。' },
          'zh-TW': { description: '關鍵字。' },
          ja: { description: 'キーワード。' },
          ko: { description: '키워드.' },
        },
        schema: { type: 'string' },
        example: 'serde',
      },
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
              properties: { keyword: { $ref: '#/components/schemas/CratesKeyword' } },
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
    path: getCratesTaxonomyPath(event, 'keywords'),
  })
})
