import { defineEventHandler } from 'h3'
import { getGithubUserPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Users'],
    summary: 'List users followed by a user',
    description: 'Lists the public accounts followed by a GitHub user with pagination.',
    'x-docs': {
      platform: 'github',
      category: 'users',
      endpoint: 'following',
      order: 14,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 用户'],
        summary: '列出用户关注的用户',
        description: '分页列出 GitHub 用户关注的公开账号。',
      },
      'zh-TW': {
        tags: ['GitHub 使用者'],
        summary: '列出使用者追蹤的使用者',
        description: '分頁列出 GitHub 使用者追蹤的公開帳號。',
      },
      ja: {
        tags: ['GitHub ユーザー'],
        summary: 'ユーザーのフォロー一覧を取得',
        description: 'GitHub ユーザーがフォローしている公開アカウントをページ分割で返します。',
      },
      ko: {
        tags: ['GitHub 사용자'],
        summary: '사용자 팔로잉 목록 조회',
        description: 'GitHub 사용자가 팔로우하는 공개 계정을 페이지별로 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://docs.github.com/rest/users/followers#list-the-people-a-user-follows',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubUsername' },
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
    path: getGithubUserPath(event, 'following'),
    resource: 'core',
  })
})
