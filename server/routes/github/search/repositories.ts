import { defineEventHandler } from 'h3'
import { proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Search'],
    summary: 'Search repositories',
    description:
      'Searches public repositories with GitHub qualifiers, sorting, and pagination. Up to 1,000 results are accessible.',
    'x-docs': {
      platform: 'github',
      category: 'search',
      endpoint: 'repositories',
      order: 98,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 搜索'],
        summary: '搜索仓库',
        description: '使用 GitHub 限定符搜索公开仓库，支持排序和分页，最多可访问前 1000 条结果。',
      },
      'zh-TW': {
        tags: ['GitHub 搜尋'],
        summary: '搜尋儲存庫',
        description: '使用 GitHub 限定詞搜尋公開儲存庫，支援排序和分頁，最多可存取前 1000 筆結果。',
      },
      ja: {
        tags: ['GitHub 検索'],
        summary: 'リポジトリを検索',
        description: 'GitHub の修飾子で公開リポジトリを検索します。並べ替えとページ分割に対応し、最大 1000 件を取得できます。',
      },
      ko: {
        tags: ['GitHub 검색'],
        summary: '저장소 검색',
        description: 'GitHub 한정자로 공개 저장소를 검색합니다. 정렬과 페이지 나누기를 지원하며 최대 1000개 결과에 접근할 수 있습니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/search/search#search-repositories' },
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
        example: 'language:TypeScript stars:>1000',
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
        schema: { type: 'string', enum: ['stars', 'forks', 'help-wanted-issues', 'updated'] },
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
                items: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/GithubRepositorySummary' },
                },
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
    path: 'search/repositories',
    resource: 'search',
  })
})
