import { defineEventHandler } from 'h3'
import { proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Keywords'],
    summary: 'List keywords',
    description: 'Lists crate keywords with sorting and pagination.',
    'x-docs': {
      platform: 'crates',
      category: 'keywords',
      endpoint: 'list',
      order: 340,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 关键词'],
        summary: '列出关键词',
        description: '分页列出依赖包关键词，支持排序。',
      },
      'zh-TW': {
        tags: ['crates.io 關鍵字'],
        summary: '列出關鍵字',
        description: '分頁列出套件關鍵字，支援排序。',
      },
      ja: {
        tags: ['crates.io キーワード'],
        summary: 'キーワード一覧を取得',
        description: 'パッケージのキーワードを並べ替えとページ分割で返します。',
      },
      ko: {
        tags: ['crates.io 키워드'],
        summary: '키워드 목록 조회',
        description: '패키지 키워드를 정렬 및 페이지 나누기로 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/rust-lang/crates.io/blob/main/src/controllers/keyword.rs',
    },
    security: [],
    parameters: [
      {
        name: 'sort',
        in: 'query',
        description: 'Sort by name or crate count.',
        'x-i18n': {
          'zh-CN': { description: '按名称或依赖包数量排序。' },
          'zh-TW': { description: '依名稱或套件數量排序。' },
          ja: { description: '名前またはパッケージ数で並べ替えます。' },
          ko: { description: '이름 또는 패키지 수로 정렬합니다.' },
        },
        schema: { type: 'string', enum: ['alpha', 'crates'], default: 'alpha' },
      },
      { $ref: '#/components/parameters/CratesPerPage' },
      { $ref: '#/components/parameters/CratesPage' },
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
                keywords: { type: 'array', items: { $ref: '#/components/schemas/CratesKeyword' } },
                meta: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    total: { type: 'integer', minimum: 0 },
                    next_page: { type: ['string', 'null'] },
                    prev_page: { type: ['string', 'null'] },
                  },
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
    path: 'api/v1/keywords',
  })
})
