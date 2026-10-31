import { defineEventHandler } from 'h3'
import { proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Categories'],
    summary: 'List categories',
    description: 'Lists top-level crate categories with sorting and pagination.',
    'x-docs': {
      platform: 'crates',
      category: 'categories',
      endpoint: 'list',
      order: 320,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 分类'],
        summary: '列出分类',
        description: '分页列出依赖包顶层分类，支持排序。',
      },
      'zh-TW': {
        tags: ['crates.io 分類'],
        summary: '列出分類',
        description: '分頁列出套件頂層分類，支援排序。',
      },
      ja: {
        tags: ['crates.io カテゴリ'],
        summary: 'カテゴリ一覧を取得',
        description: 'パッケージのトップレベルカテゴリを並べ替えとページ分割で返します。',
      },
      ko: {
        tags: ['crates.io 분류'],
        summary: '분류 목록 조회',
        description: '패키지의 최상위 분류를 정렬 및 페이지 나누기로 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/rust-lang/crates.io/blob/main/src/controllers/category.rs',
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
                categories: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CratesCategory' },
                },
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
    path: 'api/v1/categories',
  })
})
