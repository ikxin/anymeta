import { defineEventHandler } from 'h3'
import { getCratesTaxonomyPath, proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Categories'],
    summary: 'Get category metadata',
    description: 'Returns a category, its parent categories, and its subcategories.',
    'x-docs': {
      platform: 'crates',
      category: 'categories',
      endpoint: 'get',
      order: 330,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 分类'],
        summary: '获取分类信息',
        description: '返回分类信息及其父分类和子分类。',
      },
      'zh-TW': {
        tags: ['crates.io 分類'],
        summary: '取得分類資訊',
        description: '傳回分類資訊及其父分類和子分類。',
      },
      ja: {
        tags: ['crates.io カテゴリ'],
        summary: 'カテゴリ情報を取得',
        description: 'カテゴリ、親カテゴリ、サブカテゴリを返します。',
      },
      ko: {
        tags: ['crates.io 분류'],
        summary: '분류 정보 조회',
        description: '분류와 상위 및 하위 분류를 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/rust-lang/crates.io/blob/main/src/controllers/category.rs',
    },
    security: [],
    parameters: [
      {
        name: 'category',
        in: 'path',
        required: true,
        description: 'A category slug, including nested slugs with ::.',
        'x-i18n': {
          'zh-CN': { description: '分类标识，支持包含 :: 的子分类标识。' },
          'zh-TW': { description: '分類識別碼，支援包含 :: 的子分類識別碼。' },
          ja: { description: 'カテゴリ識別子。:: を含むサブカテゴリにも対応します。' },
          ko: { description: '분류 식별자. ::가 포함된 하위 분류를 지원합니다.' },
        },
        schema: { type: 'string' },
        example: 'development-tools',
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
              properties: { category: { $ref: '#/components/schemas/CratesCategory' } },
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
    path: getCratesTaxonomyPath(event, 'categories'),
  })
})
