import { defineEventHandler } from 'h3'
import { getGithubRepositoryRefPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Commits'],
    summary: 'Get a repository commit',
    description:
      'Returns a commit with file changes and statistics. Pagination applies to the changed files.',
    'x-docs': {
      platform: 'github',
      category: 'commits',
      endpoint: 'get',
      order: 79,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 提交'],
        summary: '获取仓库提交信息',
        description: '返回提交信息、文件变更和统计数据，分页参数用于变更文件列表。',
      },
      'zh-TW': {
        tags: ['GitHub 提交'],
        summary: '取得儲存庫提交資訊',
        description: '傳回提交資訊、檔案變更和統計資料，分頁參數用於變更檔案清單。',
      },
      ja: {
        tags: ['GitHub コミット'],
        summary: 'コミット情報を取得',
        description: 'コミット情報、変更ファイル、統計を返します。ページ分割は変更ファイルに適用されます。',
      },
      ko: {
        tags: ['GitHub 커밋'],
        summary: '저장소 커밋 정보 조회',
        description: '커밋 정보, 변경 파일 및 통계를 반환합니다. 페이지 나누기는 변경 파일에 적용됩니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/commits/commits#get-a-commit' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'ref',
        in: 'path',
        required: true,
        description:
          'A commit hash, branch, or tag. Encode slashes when using a single path segment.',
        'x-i18n': {
          'zh-CN': { description: '提交哈希、分支或标签，作为单个路径段使用时需编码斜杠。' },
          'zh-TW': { description: '提交雜湊、分支或標籤，作為單一路徑區段使用時需編碼斜線。' },
          ja: { description: 'コミットハッシュ、ブランチ、タグ。単一のパス要素ではスラッシュをエンコードします。' },
          ko: { description: '커밋 해시, 브랜치 또는 태그. 단일 경로 세그먼트에서는 슬래시를 인코딩합니다.' },
        },
        schema: { type: 'string' },
        example: 'main',
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
        content: { 'application/json': { schema: { $ref: '#/components/schemas/GithubCommit' } } },
      },
      304: { $ref: '#/components/responses/GithubNotModified' },
      default: { $ref: '#/components/responses/GithubError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubRepositoryRefPath(event, 'commits'),
    resource: 'core',
  })
})
