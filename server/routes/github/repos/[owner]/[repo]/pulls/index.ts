import { defineEventHandler } from 'h3'
import { getGithubRepositoryPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Pull Requests'],
    summary: 'List pull requests',
    description:
      'Lists pull requests in a public repository with state, branch, sorting, and pagination filters.',
    'x-docs': {
      platform: 'github',
      category: 'pulls',
      endpoint: 'list',
      order: 95,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 拉取请求'],
        summary: '列出拉取请求',
        description: '列出公开仓库的拉取请求，支持状态、分支、排序和分页筛选。',
      },
      'zh-TW': {
        tags: ['GitHub 提取要求'],
        summary: '列出提取要求',
        description: '列出公開儲存庫的提取要求，支援狀態、分支、排序和分頁篩選。',
      },
      ja: {
        tags: ['GitHub プルリクエスト'],
        summary: 'プルリクエスト一覧を取得',
        description: '公開リポジトリのプルリクエストを状態、ブランチ、並べ替え、ページ分割で取得します。',
      },
      ko: {
        tags: ['GitHub 풀 리퀘스트'],
        summary: '풀 리퀘스트 목록 조회',
        description: '공개 저장소의 풀 리퀘스트를 상태, 브랜치, 정렬 및 페이지 나누기로 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/pulls/pulls#list-pull-requests' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'state',
        in: 'query',
        description: 'Filter by state.',
        'x-i18n': {
          'zh-CN': { description: '按状态筛选。' },
          'zh-TW': { description: '依狀態篩選。' },
          ja: { description: '状態で絞り込みます。' },
          ko: { description: '상태로 필터링합니다.' },
        },
        schema: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
      },
      {
        name: 'head',
        in: 'query',
        description: 'Head account and branch, such as user:feature.',
        'x-i18n': {
          'zh-CN': { description: '源账号和分支，例如 user:feature。' },
          'zh-TW': { description: '來源帳號和分支，例如 user:feature。' },
          ja: { description: 'user:feature などの元アカウントとブランチ。' },
          ko: { description: 'user:feature 등의 소스 계정 및 브랜치.' },
        },
        schema: { type: 'string' },
      },
      {
        name: 'base',
        in: 'query',
        description: 'The target branch name.',
        'x-i18n': {
          'zh-CN': { description: '目标分支名称。' },
          'zh-TW': { description: '目標分支名稱。' },
          ja: { description: '対象ブランチ名。' },
          ko: { description: '대상 브랜치 이름.' },
        },
        schema: { type: 'string' },
      },
      {
        name: 'sort',
        in: 'query',
        description: 'Sort field.',
        'x-i18n': {
          'zh-CN': { description: '排序字段。' },
          'zh-TW': { description: '排序欄位。' },
          ja: { description: '並べ替え項目。' },
          ko: { description: '정렬 필드.' },
        },
        schema: {
          type: 'string',
          enum: ['created', 'updated', 'popularity', 'long-running'],
          default: 'created',
        },
      },
      {
        name: 'direction',
        in: 'query',
        description: 'Sort direction.',
        'x-i18n': {
          'zh-CN': { description: '排序方向。' },
          'zh-TW': { description: '排序方向。' },
          ja: { description: '並び順。' },
          ko: { description: '정렬 방향.' },
        },
        schema: { type: 'string', enum: ['asc', 'desc'] },
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
            schema: { type: 'array', items: { $ref: '#/components/schemas/GithubPullRequest' } },
          },
        },
      },
      304: { $ref: '#/components/responses/GithubNotModified' },
      default: { $ref: '#/components/responses/GithubError' },
    },
    $global: {
      components: {
        schemas: {
          GithubPullRequest: {
            allOf: [
              { $ref: '#/components/schemas/GithubIssue' },
              {
                type: 'object',
                additionalProperties: true,
                properties: {
                  draft: { type: 'boolean' },
                  merged: { type: 'boolean' },
                  merged_at: { type: ['string', 'null'], format: 'date-time' },
                  mergeable: { type: ['boolean', 'null'] },
                  merge_commit_sha: { type: ['string', 'null'] },
                  head: {
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                      label: { type: 'string' },
                      ref: { type: 'string' },
                      sha: { type: 'string' },
                      user: {
                        anyOf: [
                          { $ref: '#/components/schemas/GithubUserSummary' },
                          { type: 'null' },
                        ],
                      },
                      repo: {
                        anyOf: [
                          { $ref: '#/components/schemas/GithubRepositorySummary' },
                          { type: 'null' },
                        ],
                      },
                    },
                  },
                  base: {
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                      label: { type: 'string' },
                      ref: { type: 'string' },
                      sha: { type: 'string' },
                      user: {
                        anyOf: [
                          { $ref: '#/components/schemas/GithubUserSummary' },
                          { type: 'null' },
                        ],
                      },
                      repo: {
                        anyOf: [
                          { $ref: '#/components/schemas/GithubRepositorySummary' },
                          { type: 'null' },
                        ],
                      },
                    },
                  },
                  merged_by: {
                    anyOf: [{ $ref: '#/components/schemas/GithubUserSummary' }, { type: 'null' }],
                  },
                  commits: { type: 'integer', minimum: 0 },
                  additions: { type: 'integer', minimum: 0 },
                  deletions: { type: 'integer', minimum: 0 },
                  changed_files: { type: 'integer', minimum: 0 },
                  review_comments: { type: 'integer', minimum: 0 },
                  diff_url: { type: 'string', format: 'uri' },
                  patch_url: { type: 'string', format: 'uri' },
                },
              },
            ],
          },
        },
      },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubRepositoryPath(event, 'pulls'),
    resource: 'core',
  })
})
