import { defineEventHandler } from 'h3'
import { proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Search'],
    summary: 'Search crates',
    description:
      'Searches or lists crates with sorting and filters. Page and seek are mutually exclusive; relevance sorting exposes up to 1,000 results.',
    'x-docs': {
      platform: 'crates',
      category: 'search',
      endpoint: 'get',
      order: 310,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 搜索'],
        summary: '搜索依赖包',
        description: '搜索或列出依赖包，支持排序和筛选。page 与 seek 互斥，按相关性排序最多可访问前 1000 条结果。',
      },
      'zh-TW': {
        tags: ['crates.io 搜尋'],
        summary: '搜尋套件',
        description: '搜尋或列出套件，支援排序和篩選。page 與 seek 互斥，依相關性排序最多可存取前 1000 筆結果。',
      },
      ja: {
        tags: ['crates.io 検索'],
        summary: 'パッケージを検索',
        description: 'パッケージを検索または一覧表示します。page と seek は併用できず、関連度順では最大 1000 件を取得できます。',
      },
      ko: {
        tags: ['crates.io 검색'],
        summary: '패키지 검색',
        description: '패키지를 검색하거나 나열합니다. page와 seek는 함께 사용할 수 없으며 관련성순으로 최대 1000개 결과에 접근할 수 있습니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/rust-lang/crates.io/blob/main/src/controllers/krate/search.rs',
    },
    security: [],
    parameters: [
      {
        name: 'q',
        in: 'query',
        description: 'Search text. Omit to browse crates.',
        'x-i18n': {
          'zh-CN': { description: '搜索文本，省略时浏览依赖包。' },
          'zh-TW': { description: '搜尋文字，省略時瀏覽套件。' },
          ja: { description: '検索語。省略時は一覧を取得します。' },
          ko: { description: '검색어. 생략하면 패키지 목록을 조회합니다.' },
        },
        schema: { type: 'string' },
        example: 'serde',
      },
      {
        name: 'sort',
        in: 'query',
        description: 'Sort order. Defaults to relevance with q, alphabetical otherwise.',
        'x-i18n': {
          'zh-CN': { description: '排序方式，有 q 时默认按相关性排序，否则按字母排序。' },
          'zh-TW': { description: '排序方式，有 q 時預設依相關性排序，否則依字母排序。' },
          ja: { description: '並び順。q 指定時は関連度順、それ以外は名前順が既定です。' },
          ko: { description: '정렬 방식. q가 있으면 관련성순, 없으면 이름순이 기본값입니다.' },
        },
        schema: {
          type: 'string',
          enum: [
            'alphabetical',
            'relevance',
            'downloads',
            'recent-downloads',
            'recent-updates',
            'new',
          ],
        },
      },
      {
        name: 'category',
        in: 'query',
        description: 'Filter by category slug, including subcategories.',
        'x-i18n': {
          'zh-CN': { description: '按分类标识筛选，包含其子分类。' },
          'zh-TW': { description: '依分類識別碼篩選，包含其子分類。' },
          ja: { description: 'サブカテゴリを含むカテゴリ識別子で絞り込みます。' },
          ko: { description: '하위 분류를 포함한 분류 식별자로 필터링합니다.' },
        },
        schema: { type: 'string' },
      },
      {
        name: 'keyword',
        in: 'query',
        description: 'Filter by one keyword.',
        'x-i18n': {
          'zh-CN': { description: '按单个关键词筛选。' },
          'zh-TW': { description: '依單一關鍵字篩選。' },
          ja: { description: '単一のキーワードで絞り込みます。' },
          ko: { description: '단일 키워드로 필터링합니다.' },
        },
        schema: { type: 'string' },
      },
      {
        name: 'all_keywords',
        in: 'query',
        description: 'Space-separated keywords that must all match.',
        'x-i18n': {
          'zh-CN': { description: '必须全部匹配的关键词，用空格分隔。' },
          'zh-TW': { description: '必須全部符合的關鍵字，以空格分隔。' },
          ja: { description: 'すべて一致させるキーワードを空白で区切ります。' },
          ko: { description: '모두 일치해야 하는 키워드를 공백으로 구분합니다.' },
        },
        schema: { type: 'string' },
      },
      {
        name: 'user_id',
        in: 'query',
        description: 'Filter by crates.io owner user ID.',
        'x-i18n': {
          'zh-CN': { description: '按 crates.io 维护者用户编号筛选。' },
          'zh-TW': { description: '依 crates.io 維護者使用者編號篩選。' },
          ja: { description: 'crates.io オーナーのユーザー ID で絞り込みます。' },
          ko: { description: 'crates.io 소유자 사용자 ID로 필터링합니다.' },
        },
        schema: { type: 'integer', minimum: 1 },
      },
      {
        name: 'team_id',
        in: 'query',
        description: 'Filter by crates.io owner team ID.',
        'x-i18n': {
          'zh-CN': { description: '按 crates.io 维护者团队编号筛选。' },
          'zh-TW': { description: '依 crates.io 維護者團隊編號篩選。' },
          ja: { description: 'crates.io オーナーチーム ID で絞り込みます。' },
          ko: { description: 'crates.io 소유자 팀 ID로 필터링합니다.' },
        },
        schema: { type: 'integer', minimum: 1 },
      },
      {
        name: 'include_yanked',
        in: 'query',
        description: 'Whether to include yanked crates.',
        'x-i18n': {
          'zh-CN': { description: '是否包含已撤回的依赖包。' },
          'zh-TW': { description: '是否包含已撤回的套件。' },
          ja: { description: '取り下げられたパッケージを含めるかどうか。' },
          ko: { description: '철회된 패키지를 포함할지 여부.' },
        },
        schema: { type: 'string', enum: ['yes', 'no'] },
      },
      { $ref: '#/components/parameters/CratesPerPage' },
      { $ref: '#/components/parameters/CratesPage' },
      { $ref: '#/components/parameters/CratesSeek' },
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
                crates: { type: 'array', items: { $ref: '#/components/schemas/CratesPackage' } },
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
    path: 'api/v1/crates',
  })
})
