import { defineEventHandler } from 'h3'
import { getGithubRepositoryItemPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Pull Requests'],
    summary: 'List pull request files',
    description:
      'Lists changed files in a pull request with diff statistics and available patches.',
    'x-docs': {
      platform: 'github',
      category: 'pulls',
      endpoint: 'files',
      order: 97,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 拉取请求'],
        summary: '列出拉取请求文件',
        description: '列出拉取请求的变更文件，包括差异统计和可用的补丁内容。',
      },
      'zh-TW': {
        tags: ['GitHub 提取要求'],
        summary: '列出提取要求檔案',
        description: '列出提取要求的變更檔案，包括差異統計和可用的修補內容。',
      },
      ja: {
        tags: ['GitHub プルリクエスト'],
        summary: 'プルリクエストの変更ファイルを取得',
        description: 'プルリクエストの変更ファイル、差分統計、利用可能なパッチを返します。',
      },
      ko: {
        tags: ['GitHub 풀 리퀘스트'],
        summary: '풀 리퀘스트 변경 파일 목록 조회',
        description: '풀 리퀘스트의 변경 파일, 차이 통계 및 사용 가능한 패치를 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/pulls/pulls#list-pull-requests-files' },
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
            schema: { type: 'array', items: { $ref: '#/components/schemas/GithubDiffFile' } },
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
    path: getGithubRepositoryItemPath(event, 'pulls', 'files'),
    resource: 'core',
  })
})
