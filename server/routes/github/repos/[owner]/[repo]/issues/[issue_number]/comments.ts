import { defineEventHandler } from 'h3'
import { getGithubRepositoryItemPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Issues'],
    summary: 'List issue comments',
    description:
      'Lists conversation comments on an issue or pull request, with pagination and a time filter.',
    'x-docs': {
      platform: 'github',
      category: 'issues',
      endpoint: 'comments',
      order: 94,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 议题'],
        summary: '列出议题评论',
        description: '列出议题或拉取请求的讨论评论，支持分页和时间筛选。',
      },
      'zh-TW': {
        tags: ['GitHub 議題'],
        summary: '列出議題留言',
        description: '列出議題或提取要求的討論留言，支援分頁和時間篩選。',
      },
      ja: {
        tags: ['GitHub Issue'],
        summary: 'Issue のコメント一覧を取得',
        description: 'Issue またはプルリクエストの会話コメントをページ分割と日時の条件で取得します。',
      },
      ko: {
        tags: ['GitHub 이슈'],
        summary: '이슈 댓글 목록 조회',
        description: '이슈 또는 풀 리퀘스트의 대화 댓글을 페이지 나누기와 시간 필터로 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/issues/comments#list-issue-comments' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'issue_number',
        in: 'path',
        required: true,
        description: 'The issue or pull request number.',
        'x-i18n': {
          'zh-CN': { description: '议题或拉取请求编号。' },
          'zh-TW': { description: '議題或提取要求編號。' },
          ja: { description: 'Issue またはプルリクエスト番号。' },
          ko: { description: '이슈 또는 풀 리퀘스트 번호.' },
        },
        schema: { type: 'integer', minimum: 1 },
        example: 1,
      },
      {
        name: 'since',
        in: 'query',
        description: 'Only results after this ISO 8601 timestamp.',
        'x-i18n': {
          'zh-CN': { description: '仅返回此 ISO 8601 时间之后的结果。' },
          'zh-TW': { description: '僅傳回此 ISO 8601 時間之後的結果。' },
          ja: { description: 'この ISO 8601 日時以降の結果。' },
          ko: { description: '이 ISO 8601 시간 이후의 결과.' },
        },
        schema: { type: 'string', format: 'date-time' },
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
            schema: { type: 'array', items: { $ref: '#/components/schemas/GithubIssueComment' } },
          },
        },
      },
      304: { $ref: '#/components/responses/GithubNotModified' },
      default: { $ref: '#/components/responses/GithubError' },
    },
    $global: {
      components: {
        schemas: {
          GithubIssueComment: {
            type: 'object',
            additionalProperties: true,
            required: ['id'],
            properties: {
              id: { type: 'integer' },
              body: { type: ['string', 'null'] },
              user: {
                anyOf: [{ $ref: '#/components/schemas/GithubUserSummary' }, { type: 'null' }],
              },
              html_url: { type: 'string', format: 'uri' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              author_association: { type: 'string' },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubRepositoryItemPath(event, 'issues', 'comments'),
    resource: 'core',
  })
})
