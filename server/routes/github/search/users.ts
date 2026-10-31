import { defineEventHandler } from 'h3'
import { proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Search'],
    summary: 'Search users and organizations',
    description:
      'Searches public users and organizations with GitHub qualifiers and pagination. Use type:user or type:org to filter.',
    'x-docs': {
      platform: 'github',
      category: 'search',
      endpoint: 'users',
      order: 99,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 搜索'],
        summary: '搜索用户和组织',
        description: '使用 GitHub 限定符分页搜索公开用户和组织，可通过 type:user 或 type:org 筛选类型。',
      },
      'zh-TW': {
        tags: ['GitHub 搜尋'],
        summary: '搜尋使用者和組織',
        description: '使用 GitHub 限定詞分頁搜尋公開使用者和組織，可透過 type:user 或 type:org 篩選類型。',
      },
      ja: {
        tags: ['GitHub 検索'],
        summary: 'ユーザーと組織を検索',
        description: 'GitHub の修飾子で公開ユーザーと組織を検索します。type:user または type:org で絞り込めます。',
      },
      ko: {
        tags: ['GitHub 검색'],
        summary: '사용자 및 조직 검색',
        description: 'GitHub 한정자로 공개 사용자 및 조직을 페이지별로 검색합니다. type:user 또는 type:org로 필터링할 수 있습니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/search/search#search-users' },
    security: [],
    parameters: [
      {
        name: 'q',
        in: 'query',
        required: true,
        description: 'Search terms and GitHub qualifiers.',
        'x-i18n': {
          'zh-CN': { description: '搜索词和 GitHub 限定符。' },
          'zh-TW': { description: '搜尋字詞和 GitHub 限定詞。' },
          ja: { description: '検索語と GitHub の修飾子。' },
          ko: { description: '검색어 및 GitHub 한정자.' },
        },
        schema: { type: 'string' },
        example: 'type:user followers:>1000',
      },
      {
        name: 'sort',
        in: 'query',
        description: 'Sort field. Defaults to best match when omitted.',
        'x-i18n': {
          'zh-CN': { description: '排序字段，省略时默认按最佳匹配排序。' },
          'zh-TW': { description: '排序欄位，省略時預設依最佳比對排序。' },
          ja: { description: '並べ替え項目。省略時は適合度順。' },
          ko: { description: '정렬 필드. 생략하면 최적 일치순.' },
        },
        schema: { type: 'string', enum: ['followers', 'repositories', 'joined'] },
      },
      {
        name: 'order',
        in: 'query',
        description: 'Sort direction.',
        'x-i18n': {
          'zh-CN': { description: '排序方向。' },
          'zh-TW': { description: '排序方向。' },
          ja: { description: '並び順。' },
          ko: { description: '정렬 방향.' },
        },
        schema: { type: 'string', enum: ['desc', 'asc'], default: 'desc' },
      },
      { $ref: '#/components/parameters/GithubPerPage' },
      { $ref: '#/components/parameters/GithubPage' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'The original GitHub response.',
        'x-i18n': {
          'zh-CN': { description: 'GitHub 原始响应。' },
          'zh-TW': { description: 'GitHub 原始回應。' },
          ja: { description: 'GitHub の元のレスポンス。' },
          ko: { description: 'GitHub 원본 응답.' },
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              required: ['total_count', 'incomplete_results', 'items'],
              properties: {
                total_count: { type: 'integer', minimum: 0 },
                incomplete_results: { type: 'boolean' },
                items: { type: 'array', items: { $ref: '#/components/schemas/GithubUserSummary' } },
              },
            },
          },
        },
      },
      304: { $ref: '#/components/responses/GithubNotModified' },
      default: { $ref: '#/components/responses/GithubError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: 'search/users',
    resource: 'search',
  })
})
