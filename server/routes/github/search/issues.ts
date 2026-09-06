import { defineEventHandler } from 'h3'
import { proxyGithubRequest } from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'searchGithubIssues',
    tags: ['GitHub Search'],
    summary: 'Search issues and pull requests',
    description: 'Find public issues and pull requests using GitHub search syntax.',
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 搜索'],
        summary: '搜索议题和拉取请求',
        description: '使用 GitHub 搜索语法查找公开议题和拉取请求。',
      },
      'zh-TW': {
        tags: ['GitHub 搜尋'],
        summary: '搜尋議題和提取要求',
        description: '使用 GitHub 搜尋語法尋找公開議題和提取要求。',
      },
      ja: {
        tags: ['GitHub 検索'],
        summary: 'Issue とプルリクエストを検索',
        description: 'GitHub の検索構文を使って、公開されている Issue とプルリクエストを検索します。',
      },
      ko: {
        tags: ['GitHub 검색'],
        summary: '이슈 및 풀 리퀘스트 검색',
        description: 'GitHub 검색 구문을 사용하여 공개 이슈와 풀 리퀘스트를 찾습니다.',
      },
    },
    externalDocs: {
      description: 'GitHub REST API documentation',
      'x-i18n': {
        'zh-CN': { description: 'GitHub REST API 文档' },
        'zh-TW': { description: 'GitHub REST API 文件' },
        ja: { description: 'GitHub REST API ドキュメント' },
        ko: { description: 'GitHub REST API 문서' },
      },
      url: 'https://docs.github.com/rest/search/search#search-issues-and-pull-requests',
    },
    security: [],
    parameters: [
      {
        name: 'q',
        in: 'query',
        required: true,
        description: 'A GitHub search query containing search terms and qualifiers.',
        'x-i18n': {
          'zh-CN': { description: '包含搜索词和限定符的 GitHub 搜索查询。' },
          'zh-TW': { description: '包含搜尋字詞和限定詞的 GitHub 搜尋查詢。' },
          ja: { description: '検索語と修飾子を含む GitHub 検索クエリ。' },
          ko: { description: '검색어와 한정자를 포함하는 GitHub 검색 쿼리입니다.' },
        },
        schema: {
          type: 'string',
        },
        example: 'repo:unjs/ungh is:issue state:open',
      },
      {
        name: 'sort',
        in: 'query',
        description: 'The sort field, such as comments, reactions, interactions, created, or updated.',
        'x-i18n': {
          'zh-CN': { description: '排序字段，例如 comments、reactions、interactions、created 或 updated。' },
          'zh-TW': { description: '排序欄位，例如 comments、reactions、interactions、created 或 updated。' },
          ja: { description: '並べ替えに使うフィールド。comments、reactions、interactions、created、updated など。' },
          ko: { description: '정렬 기준 필드입니다. 예: comments, reactions, interactions, created, updated.' },
        },
        schema: {
          type: 'string',
        },
      },
      {
        name: 'order',
        in: 'query',
        description: 'The sort direction.',
        'x-i18n': {
          'zh-CN': { description: '排序方向。' },
          'zh-TW': { description: '排序方向。' },
          ja: { description: '並べ替えの方向。' },
          ko: { description: '정렬 방향입니다.' },
        },
        schema: {
          type: 'string',
          enum: ['desc', 'asc'],
          default: 'desc',
        },
      },
      { $ref: '#/components/parameters/GithubPerPage' },
      { $ref: '#/components/parameters/GithubPage' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'Search results.',
        'x-i18n': {
          'zh-CN': { description: '搜索结果。' },
          'zh-TW': { description: '搜尋結果。' },
          ja: { description: '検索結果。' },
          ko: { description: '검색 결과.' },
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
                  items: {
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                      id: { type: 'integer' },
                      number: { type: 'integer' },
                      title: { type: 'string' },
                      state: { type: 'string' },
                      html_url: { type: 'string', format: 'uri' },
                      repository_url: { type: 'string', format: 'uri' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      304: {
        description: 'Not modified.',
        'x-i18n': {
          'zh-CN': { description: '内容未修改。' },
          'zh-TW': { description: '內容未修改。' },
          ja: { description: '変更されていません。' },
          ko: { description: '변경되지 않았습니다.' },
        },
      },
      default: {
        description: 'The search parameters are invalid, the rate limit was reached, or GitHub or AnyMeta returned an error.',
        'x-i18n': {
          'zh-CN': { description: '搜索参数无效、已达到速率限制，或 GitHub 或 AnyMeta 返回了错误。' },
          'zh-TW': { description: '搜尋參數無效、已達到速率限制，或 GitHub 或 AnyMeta 傳回了錯誤。' },
          ja: { description: '検索パラメーターが無効、レート制限に到達、または GitHub か AnyMeta がエラーを返しました。' },
          ko: { description: '검색 매개변수가 유효하지 않거나, 요청 한도에 도달했거나, GitHub 또는 AnyMeta가 오류를 반환했습니다.' },
        },
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/GithubProxyError' },
          },
        },
      },
    },
  },
})

export default defineEventHandler(event => {
  return proxyGithubRequest(event, {
    path: 'search/issues',
    resource: 'search',
  })
})
