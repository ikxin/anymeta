import { defineEventHandler } from 'h3'
import { proxyNpmjsRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['npmjs Search'],
    summary: 'Search packages',
    description: 'Searches public npm packages with pagination and relevance weights.',
    'x-docs': {
      platform: 'npmjs',
      category: 'search',
      endpoint: 'get',
      order: 190,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['npmjs 搜索'],
        summary: '搜索依赖包',
        description: '搜索公开 npm 依赖包，支持分页和相关性权重。',
      },
      'zh-TW': {
        tags: ['npmjs 搜尋'],
        summary: '搜尋套件',
        description: '搜尋公開 npm 套件，支援分頁和相關性權重。',
      },
      ja: {
        tags: ['npmjs 検索'],
        summary: 'パッケージを検索',
        description: 'ページ分割と関連度の重みを指定して公開 npm パッケージを検索します。',
      },
      ko: {
        tags: ['npmjs 검색'],
        summary: '패키지 검색',
        description: '페이지 나누기와 관련성 가중치를 지원하여 공개 npm 패키지를 검색합니다.',
      },
    },
    externalDocs: { url: 'https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md' },
    security: [],
    parameters: [
      {
        name: 'text',
        in: 'query',
        required: true,
        description: 'Search terms and qualifiers such as scope:nuxt, author:name, or keywords:vue.',
        'x-i18n': {
          'zh-CN': { description: '搜索词及限定符，例如 scope:nuxt、author:name 或 keywords:vue。' },
          'zh-TW': { description: '搜尋字詞及限定詞，例如 scope:nuxt、author:name 或 keywords:vue。' },
          ja: { description: '検索語と scope:nuxt、author:name、keywords:vue などの修飾子。' },
          ko: { description: '검색어 및 scope:nuxt, author:name, keywords:vue 등의 한정자.' },
        },
        schema: { type: 'string' },
        example: 'nuxt',
      },
      {
        name: 'size',
        in: 'query',
        description: 'The number of results to return, up to 250.',
        'x-i18n': {
          'zh-CN': { description: '返回结果数量，最多 250 条。' },
          'zh-TW': { description: '傳回結果數量，最多 250 筆。' },
          ja: { description: '返す結果の件数。最大 250 件。' },
          ko: { description: '반환할 결과 수. 최대 250개.' },
        },
        schema: { type: 'integer', minimum: 0, maximum: 250, default: 20 },
      },
      {
        name: 'from',
        in: 'query',
        description: 'The zero-based result offset.',
        'x-i18n': {
          'zh-CN': { description: '从零开始的结果偏移量。' },
          'zh-TW': { description: '從零開始的結果偏移量。' },
          ja: { description: '0 から始まる結果のオフセット。' },
          ko: { description: '0부터 시작하는 결과 오프셋.' },
        },
        schema: { type: 'integer', minimum: 0, default: 0 },
      },
      {
        name: 'quality',
        in: 'query',
        description: 'The influence of package quality on result ranking.',
        'x-i18n': {
          'zh-CN': { description: '依赖包质量对结果排名的影响权重。' },
          'zh-TW': { description: '套件品質對結果排名的影響權重。' },
          ja: { description: '結果の順位に対するパッケージ品質の重み。' },
          ko: { description: '결과 순위에 대한 패키지 품질 가중치.' },
        },
        schema: { type: 'number', minimum: 0, maximum: 1 },
      },
      {
        name: 'popularity',
        in: 'query',
        description: 'The influence of package popularity on result ranking.',
        'x-i18n': {
          'zh-CN': { description: '依赖包流行度对结果排名的影响权重。' },
          'zh-TW': { description: '套件熱門程度對結果排名的影響權重。' },
          ja: { description: '結果の順位に対するパッケージ人気度の重み。' },
          ko: { description: '결과 순위에 대한 패키지 인기도 가중치.' },
        },
        schema: { type: 'number', minimum: 0, maximum: 1 },
      },
      {
        name: 'maintenance',
        in: 'query',
        description: 'The influence of package maintenance on result ranking.',
        'x-i18n': {
          'zh-CN': { description: '依赖包维护程度对结果排名的影响权重。' },
          'zh-TW': { description: '套件維護程度對結果排名的影響權重。' },
          ja: { description: '結果の順位に対するメンテナンス状況の重み。' },
          ko: { description: '결과 순위에 대한 패키지 유지 관리 가중치.' },
        },
        schema: { type: 'number', minimum: 0, maximum: 1 },
      },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'The original package search results.',
        'x-i18n': {
          'zh-CN': { description: '原始依赖包搜索结果。' },
          'zh-TW': { description: '原始套件搜尋結果。' },
          ja: { description: '元のパッケージ検索結果。' },
          ko: { description: '원본 패키지 검색 결과.' },
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              required: ['objects', 'total', 'time'],
              properties: {
                total: { type: 'integer', minimum: 0 },
                time: { type: 'string' },
                objects: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                      package: {
                        type: 'object',
                        additionalProperties: true,
                        properties: {
                          name: { type: 'string' },
                          version: { type: 'string' },
                          description: { type: 'string' },
                          keywords: { type: 'array', items: { type: 'string' } },
                          date: { type: 'string', format: 'date-time' },
                          links: { type: 'object', additionalProperties: { type: 'string' } },
                        },
                      },
                      score: {
                        type: 'object',
                        additionalProperties: true,
                        properties: {
                          final: { type: 'number' },
                          detail: { type: 'object', additionalProperties: { type: 'number' } },
                        },
                      },
                      searchScore: { type: 'number' },
                      downloads: {
                        type: 'object',
                        additionalProperties: { type: 'integer', minimum: 0 },
                      },
                      dependents: { type: 'string' },
                      updated: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      304: { $ref: '#/components/responses/NpmjsNotModified' },
      default: { $ref: '#/components/responses/NpmjsError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyNpmjsRequest(event, '-/v1/search', 'registry')
})
