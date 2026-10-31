import { defineEventHandler } from 'h3'
import { getGithubRepositoryPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Repository'],
    summary: 'List repository forks',
    description: 'Lists public forks of a repository with sorting and pagination.',
    'x-docs': {
      platform: 'github',
      category: 'repos',
      endpoint: 'forks',
      order: 73,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 仓库'],
        summary: '列出仓库分叉',
        description: '列出仓库的公开分叉，支持排序和分页。',
      },
      'zh-TW': {
        tags: ['GitHub 儲存庫'],
        summary: '列出儲存庫分支副本',
        description: '列出儲存庫的公開分支副本，支援排序和分頁。',
      },
      ja: {
        tags: ['GitHub リポジトリ'],
        summary: 'リポジトリのフォーク一覧を取得',
        description: 'リポジトリの公開フォークを並べ替えとページ分割付きで返します。',
      },
      ko: {
        tags: ['GitHub 저장소'],
        summary: '저장소 포크 목록 조회',
        description: '저장소의 공개 포크를 정렬 및 페이지 나누기로 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/repos/forks#list-forks' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
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
          enum: ['newest', 'oldest', 'stargazers', 'watchers'],
          default: 'newest',
        },
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
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubRepositoryPath(event, 'forks'),
    resource: 'core',
  })
})
