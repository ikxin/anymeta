import { defineEventHandler } from 'h3'
import { getGithubRepositoryContentPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Repository'],
    summary: 'Get repository content',
    description:
      'Returns file metadata and Base64 content, or a directory listing. GitHub file-size and directory limits apply.',
    'x-docs': {
      platform: 'github',
      category: 'repos',
      endpoint: 'contents',
      order: 76,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 仓库'],
        summary: '获取仓库内容',
        description: '返回文件元数据和 Base64 内容，或目录列表，遵循 GitHub 的文件大小和目录数量限制。',
      },
      'zh-TW': {
        tags: ['GitHub 儲存庫'],
        summary: '取得儲存庫內容',
        description: '傳回檔案中繼資料和 Base64 內容，或目錄清單，遵循 GitHub 的檔案大小和目錄數量限制。',
      },
      ja: {
        tags: ['GitHub リポジトリ'],
        summary: 'リポジトリのコンテンツを取得',
        description: 'ファイルのメタデータと Base64 内容、またはディレクトリ一覧を返します。GitHub のサイズと件数制限が適用されます。',
      },
      ko: {
        tags: ['GitHub 저장소'],
        summary: '저장소 콘텐츠 조회',
        description: '파일 메타데이터와 Base64 콘텐츠 또는 디렉터리 목록을 반환합니다. GitHub 파일 크기 및 디렉터리 제한이 적용됩니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/repos/contents#get-repository-content' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'path',
        in: 'path',
        required: true,
        description:
          'A file or directory path relative to the repository root. Nested paths are supported.',
        'x-i18n': {
          'zh-CN': { description: '相对于仓库根目录的文件或目录路径，支持多级目录。' },
          'zh-TW': { description: '相對於儲存庫根目錄的檔案或目錄路徑，支援多層目錄。' },
          ja: { description: 'リポジトリのルートからのファイルまたはディレクトリの相対パス。階層に対応します。' },
          ko: { description: '저장소 루트 기준 파일 또는 디렉터리 상대 경로. 중첩 경로를 지원합니다.' },
        },
        schema: { type: 'string' },
        example: 'package.json',
      },
      {
        name: 'ref',
        in: 'query',
        description: 'A commit, branch, or tag. Defaults to the default branch.',
        'x-i18n': {
          'zh-CN': { description: '提交、分支或标签，默认使用仓库的默认分支。' },
          'zh-TW': { description: '提交、分支或標籤，預設使用儲存庫的預設分支。' },
          ja: { description: 'コミット、ブランチ、タグ。既定はデフォルトブランチ。' },
          ko: { description: '커밋, 브랜치 또는 태그. 기본값은 기본 브랜치입니다.' },
        },
        schema: { type: 'string' },
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
          'application/json': {
            schema: {
              oneOf: [
                { $ref: '#/components/schemas/GithubContent' },
                { type: 'array', items: { $ref: '#/components/schemas/GithubContent' } },
              ],
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
    path: getGithubRepositoryContentPath(event),
    resource: 'core',
  })
})
