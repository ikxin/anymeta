import { defineEventHandler } from 'h3'
import { getGithubRepositoryItemPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Issues'],
    summary: 'Get an issue',
    description:
      'Returns the original issue metadata. Pull request numbers are also supported by the issues API.',
    'x-docs': {
      platform: 'github',
      category: 'issues',
      endpoint: 'get',
      order: 93,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 议题'],
        summary: '获取议题信息',
        description: '返回议题原始元数据，议题接口同样支持拉取请求编号。',
      },
      'zh-TW': {
        tags: ['GitHub 議題'],
        summary: '取得議題資訊',
        description: '傳回議題原始中繼資料，議題介面同樣支援提取要求編號。',
      },
      ja: {
        tags: ['GitHub Issue'],
        summary: 'Issue 情報を取得',
        description: 'Issue の元のメタデータを返します。プルリクエスト番号にも対応します。',
      },
      ko: {
        tags: ['GitHub 이슈'],
        summary: '이슈 정보 조회',
        description: '이슈 원본 메타데이터를 반환합니다. 이슈 API는 풀 리퀘스트 번호도 지원합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/issues/issues#get-an-issue' },
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
        content: { 'application/json': { schema: { $ref: '#/components/schemas/GithubIssue' } } },
      },
      304: { $ref: '#/components/responses/GithubNotModified' },
      default: { $ref: '#/components/responses/GithubError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubRepositoryItemPath(event, 'issues'),
    resource: 'core',
  })
})
