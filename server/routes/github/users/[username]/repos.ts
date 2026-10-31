import { defineEventHandler } from 'h3'
import { getGithubUserPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Users'],
    summary: 'List user repositories',
    description: 'Lists public repositories for a GitHub user with sorting and pagination.',
    'x-docs': {
      platform: 'github',
      category: 'users',
      endpoint: 'repos',
      order: 12,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 用户'],
        summary: '列出用户仓库',
        description: '列出 GitHub 用户的公开仓库，支持排序和分页。',
      },
      'zh-TW': {
        tags: ['GitHub 使用者'],
        summary: '列出使用者儲存庫',
        description: '列出 GitHub 使用者的公開儲存庫，支援排序和分頁。',
      },
      ja: {
        tags: ['GitHub ユーザー'],
        summary: 'ユーザーのリポジトリ一覧を取得',
        description: 'GitHub ユーザーの公開リポジトリを並べ替えとページ分割付きで返します。',
      },
      ko: {
        tags: ['GitHub 사용자'],
        summary: '사용자 저장소 목록 조회',
        description: 'GitHub 사용자의 공개 저장소를 정렬 및 페이지 나누기로 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/repos/repos#list-repositories-for-a-user' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubUsername' },
      {
        name: 'type',
        in: 'query',
        description: 'Repository type.',
        'x-i18n': {
          'zh-CN': { description: '仓库类型。' },
          'zh-TW': { description: '儲存庫類型。' },
          ja: { description: 'リポジトリの種類。' },
          ko: { description: '저장소 유형.' },
        },
        schema: { type: 'string', enum: ['all', 'owner', 'member'], default: 'owner' },
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
          enum: ['created', 'updated', 'pushed', 'full_name'],
          default: 'full_name',
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
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/GithubRepositorySummary' },
            },
          },
        },
      },
      304: { $ref: '#/components/responses/GithubNotModified' },
      default: { $ref: '#/components/responses/GithubError' },
    },
    $global: {
      components: {
        schemas: {
          GithubRepositorySummary: {
            type: 'object',
            additionalProperties: true,
            required: ['id', 'name', 'full_name', 'private'],
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              full_name: { type: 'string' },
              private: { type: 'boolean' },
              owner: { $ref: '#/components/schemas/GithubUserSummary' },
              description: { type: ['string', 'null'] },
              html_url: { type: 'string', format: 'uri' },
              fork: { type: 'boolean' },
              stargazers_count: { type: 'integer', minimum: 0 },
              watchers_count: { type: 'integer', minimum: 0 },
              forks_count: { type: 'integer', minimum: 0 },
              open_issues_count: { type: 'integer', minimum: 0 },
              default_branch: { type: 'string' },
              language: { type: ['string', 'null'] },
              topics: { type: 'array', items: { type: 'string' } },
              archived: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              pushed_at: { type: ['string', 'null'], format: 'date-time' },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubUserPath(event, 'repos'),
    resource: 'core',
  })
})
