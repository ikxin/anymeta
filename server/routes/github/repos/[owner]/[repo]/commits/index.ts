import { defineEventHandler } from 'h3'
import { getGithubRepositoryPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Commits'],
    summary: 'List repository commits',
    description:
      'Lists public repository commits with branch, path, author, committer, and time filters.',
    'x-docs': {
      platform: 'github',
      category: 'commits',
      endpoint: 'list',
      order: 78,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 提交'],
        summary: '列出仓库提交',
        description: '列出公开仓库提交，支持按分支、路径、作者、提交者和时间筛选。',
      },
      'zh-TW': {
        tags: ['GitHub 提交'],
        summary: '列出儲存庫提交',
        description: '列出公開儲存庫提交，支援依分支、路徑、作者、提交者和時間篩選。',
      },
      ja: {
        tags: ['GitHub コミット'],
        summary: 'リポジトリのコミット一覧を取得',
        description: '公開リポジトリのコミットをブランチ、パス、作成者、コミッター、日時で絞り込みます。',
      },
      ko: {
        tags: ['GitHub 커밋'],
        summary: '저장소 커밋 목록 조회',
        description: '공개 저장소 커밋을 브랜치, 경로, 작성자, 커미터 및 시간으로 필터링합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/commits/commits#list-commits' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'sha',
        in: 'query',
        description: 'A branch, tag, or commit to start listing from.',
        'x-i18n': {
          'zh-CN': { description: '提交列表的起始分支、标签或提交。' },
          'zh-TW': { description: '提交清單的起始分支、標籤或提交。' },
          ja: { description: '一覧の起点となるブランチ、タグ、コミット。' },
          ko: { description: '목록 시작 브랜치, 태그 또는 커밋.' },
        },
        schema: { type: 'string' },
      },
      {
        name: 'path',
        in: 'query',
        description: 'Only commits affecting this path.',
        'x-i18n': {
          'zh-CN': { description: '仅返回影响此路径的提交。' },
          'zh-TW': { description: '僅傳回影響此路徑的提交。' },
          ja: { description: 'このパスに影響するコミット。' },
          ko: { description: '이 경로에 영향을 주는 커밋.' },
        },
        schema: { type: 'string' },
      },
      {
        name: 'author',
        in: 'query',
        description: 'Commit author username or email.',
        'x-i18n': {
          'zh-CN': { description: '提交作者的用户名或邮箱。' },
          'zh-TW': { description: '提交作者的使用者名稱或電子郵件。' },
          ja: { description: 'コミット作成者のユーザー名またはメール。' },
          ko: { description: '커밋 작성자의 사용자 이름 또는 이메일.' },
        },
        schema: { type: 'string' },
      },
      {
        name: 'committer',
        in: 'query',
        description: 'Committer username or email.',
        'x-i18n': {
          'zh-CN': { description: '提交者的用户名或邮箱。' },
          'zh-TW': { description: '提交者的使用者名稱或電子郵件。' },
          ja: { description: 'コミッターのユーザー名またはメール。' },
          ko: { description: '커미터의 사용자 이름 또는 이메일.' },
        },
        schema: { type: 'string' },
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
      {
        name: 'until',
        in: 'query',
        description: 'Only commits before this ISO 8601 timestamp.',
        'x-i18n': {
          'zh-CN': { description: '仅返回此 ISO 8601 时间之前的提交。' },
          'zh-TW': { description: '僅傳回此 ISO 8601 時間之前的提交。' },
          ja: { description: 'この ISO 8601 日時より前のコミット。' },
          ko: { description: '이 ISO 8601 시간 이전의 커밋.' },
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
            schema: { type: 'array', items: { $ref: '#/components/schemas/GithubCommit' } },
          },
        },
      },
      304: { $ref: '#/components/responses/GithubNotModified' },
      default: { $ref: '#/components/responses/GithubError' },
    },
    $global: {
      components: {
        schemas: {
          GithubCommit: {
            type: 'object',
            additionalProperties: true,
            required: ['sha', 'commit'],
            properties: {
              sha: { type: 'string' },
              node_id: { type: 'string' },
              html_url: { type: 'string', format: 'uri' },
              commit: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  message: { type: 'string' },
                  author: {
                    anyOf: [
                      {
                        type: 'object',
                        additionalProperties: true,
                        properties: {
                          name: { type: 'string' },
                          email: { type: 'string' },
                          date: { type: 'string', format: 'date-time' },
                        },
                      },
                      { type: 'null' },
                    ],
                  },
                  committer: {
                    anyOf: [
                      {
                        type: 'object',
                        additionalProperties: true,
                        properties: {
                          name: { type: 'string' },
                          email: { type: 'string' },
                          date: { type: 'string', format: 'date-time' },
                        },
                      },
                      { type: 'null' },
                    ],
                  },
                  comment_count: { type: 'integer', minimum: 0 },
                  tree: {
                    type: 'object',
                    additionalProperties: true,
                    properties: { sha: { type: 'string' }, url: { type: 'string', format: 'uri' } },
                  },
                },
              },
              author: {
                anyOf: [{ $ref: '#/components/schemas/GithubUserSummary' }, { type: 'null' }],
              },
              committer: {
                anyOf: [{ $ref: '#/components/schemas/GithubUserSummary' }, { type: 'null' }],
              },
              parents: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    sha: { type: 'string' },
                    url: { type: 'string', format: 'uri' },
                    html_url: { type: 'string', format: 'uri' },
                  },
                },
              },
              stats: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  total: { type: 'integer', minimum: 0 },
                  additions: { type: 'integer', minimum: 0 },
                  deletions: { type: 'integer', minimum: 0 },
                },
              },
              files: { type: 'array', items: { $ref: '#/components/schemas/GithubDiffFile' } },
            },
          },
          GithubDiffFile: {
            type: 'object',
            additionalProperties: true,
            properties: {
              sha: { type: 'string' },
              filename: { type: 'string' },
              status: { type: 'string' },
              additions: { type: 'integer', minimum: 0 },
              deletions: { type: 'integer', minimum: 0 },
              changes: { type: 'integer', minimum: 0 },
              blob_url: { type: 'string', format: 'uri' },
              raw_url: { type: 'string', format: 'uri' },
              contents_url: { type: 'string', format: 'uri' },
              patch: { type: 'string' },
              previous_filename: { type: 'string' },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubRepositoryPath(event, 'commits'),
    resource: 'core',
  })
})
