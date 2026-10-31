import { defineEventHandler } from 'h3'
import { getGithubRepositoryContentPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Repository'],
    summary: 'List repository root contents',
    description:
      'Lists files and directories at the root of a public repository for a commit, branch, or tag.',
    'x-docs': {
      platform: 'github',
      category: 'repos',
      endpoint: 'contents-root',
      order: 75,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 仓库'],
        summary: '列出仓库根目录',
        description: '列出公开仓库根目录中的文件和目录，可指定提交、分支或标签。',
      },
      'zh-TW': {
        tags: ['GitHub 儲存庫'],
        summary: '列出儲存庫根目錄',
        description: '列出公開儲存庫根目錄中的檔案和目錄，可指定提交、分支或標籤。',
      },
      ja: {
        tags: ['GitHub リポジトリ'],
        summary: 'リポジトリのルートディレクトリを取得',
        description: '公開リポジトリのルートにあるファイルとディレクトリを返します。コミット、ブランチ、タグを指定できます。',
      },
      ko: {
        tags: ['GitHub 저장소'],
        summary: '저장소 루트 디렉터리 목록 조회',
        description: '공개 저장소 루트의 파일과 디렉터리를 반환합니다. 커밋, 브랜치 또는 태그를 지정할 수 있습니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/repos/contents#get-repository-content' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
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
            schema: { type: 'array', items: { $ref: '#/components/schemas/GithubContent' } },
          },
        },
      },
      304: { $ref: '#/components/responses/GithubNotModified' },
      default: { $ref: '#/components/responses/GithubError' },
    },
    $global: {
      components: {
        schemas: {
          GithubContent: {
            type: 'object',
            additionalProperties: true,
            required: ['type', 'name', 'path', 'sha'],
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              path: { type: 'string' },
              sha: { type: 'string' },
              size: { type: 'integer', minimum: 0 },
              url: { type: 'string', format: 'uri' },
              html_url: { anyOf: [{ type: 'string', format: 'uri' }, { type: 'null' }] },
              git_url: { anyOf: [{ type: 'string', format: 'uri' }, { type: 'null' }] },
              download_url: { anyOf: [{ type: 'string', format: 'uri' }, { type: 'null' }] },
              encoding: { type: 'string' },
              content: { type: 'string' },
              target: { type: 'string' },
              submodule_git_url: { type: 'string' },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubRepositoryContentPath(event),
    resource: 'core',
  })
})
