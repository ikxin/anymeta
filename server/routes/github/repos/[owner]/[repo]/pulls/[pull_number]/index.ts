import { defineEventHandler } from 'h3'
import { getGithubRepositoryItemPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Pull Requests'],
    summary: 'Get a pull request',
    description:
      'Returns pull request metadata, source and target branches, merge status, and change statistics.',
    'x-docs': {
      platform: 'github',
      category: 'pulls',
      endpoint: 'get',
      order: 96,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 拉取请求'],
        summary: '获取拉取请求信息',
        description: '返回拉取请求元数据、源分支与目标分支、合并状态及变更统计。',
      },
      'zh-TW': {
        tags: ['GitHub 提取要求'],
        summary: '取得提取要求資訊',
        description: '傳回提取要求中繼資料、來源分支與目標分支、合併狀態及變更統計。',
      },
      ja: {
        tags: ['GitHub プルリクエスト'],
        summary: 'プルリクエスト情報を取得',
        description: 'プルリクエストのメタデータ、元と対象のブランチ、マージ状態、変更統計を返します。',
      },
      ko: {
        tags: ['GitHub 풀 리퀘스트'],
        summary: '풀 리퀘스트 정보 조회',
        description: '풀 리퀘스트 메타데이터, 소스 및 대상 브랜치, 병합 상태와 변경 통계를 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/pulls/pulls#get-a-pull-request' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'pull_number',
        in: 'path',
        required: true,
        description: 'The pull request number.',
        'x-i18n': {
          'zh-CN': { description: '拉取请求编号。' },
          'zh-TW': { description: '提取要求編號。' },
          ja: { description: 'プルリクエスト番号。' },
          ko: { description: '풀 리퀘스트 번호.' },
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
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/GithubPullRequest' } },
        },
      },
      304: { $ref: '#/components/responses/GithubNotModified' },
      default: { $ref: '#/components/responses/GithubError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubRepositoryItemPath(event, 'pulls'),
    resource: 'core',
  })
})
