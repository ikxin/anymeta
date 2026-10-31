import { defineEventHandler } from 'h3'
import { getGithubRepositoryPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Repository'],
    summary: 'List repository stargazers',
    description: 'Lists users who have starred a public repository with pagination.',
    'x-docs': {
      platform: 'github',
      category: 'repos',
      endpoint: 'stargazers',
      order: 74,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 仓库'],
        summary: '列出仓库收藏者',
        description: '分页列出为公开仓库添加星标的用户。',
      },
      'zh-TW': {
        tags: ['GitHub 儲存庫'],
        summary: '列出儲存庫加星使用者',
        description: '分頁列出為公開儲存庫加星的使用者。',
      },
      ja: {
        tags: ['GitHub リポジトリ'],
        summary: 'リポジトリにスターを付けたユーザーを取得',
        description: '公開リポジトリにスターを付けたユーザーをページ分割で返します。',
      },
      ko: {
        tags: ['GitHub 저장소'],
        summary: '저장소에 스타를 준 사용자 목록 조회',
        description: '공개 저장소에 스타를 준 사용자를 페이지별로 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/activity/starring#list-stargazers' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
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
            schema: { type: 'array', items: { $ref: '#/components/schemas/GithubUserSummary' } },
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
    path: getGithubRepositoryPath(event, 'stargazers'),
    resource: 'core',
  })
})
