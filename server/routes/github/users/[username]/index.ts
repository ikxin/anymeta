import { defineEventHandler } from 'h3'
import { getGithubUserPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Users'],
    summary: 'Get a user',
    description:
      'Returns public GitHub profile metadata and repository, follower, and following counts.',
    'x-docs': {
      platform: 'github',
      category: 'users',
      endpoint: 'get',
      order: 11,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 用户'],
        summary: '获取用户信息',
        description: '返回公开 GitHub 用户资料，以及公开仓库数、关注者数和关注数。',
      },
      'zh-TW': {
        tags: ['GitHub 使用者'],
        summary: '取得使用者資訊',
        description: '傳回公開 GitHub 使用者資料，以及公開儲存庫數、追蹤者數和追蹤數。',
      },
      ja: {
        tags: ['GitHub ユーザー'],
        summary: 'ユーザー情報を取得',
        description: 'GitHub の公開プロフィールとリポジトリ数、フォロワー数、フォロー数を返します。',
      },
      ko: {
        tags: ['GitHub 사용자'],
        summary: '사용자 정보 조회',
        description: 'GitHub 공개 프로필과 공개 저장소 수, 팔로워 수, 팔로잉 수를 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/users/users#get-a-user' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubUsername' },
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
              allOf: [
                { $ref: '#/components/schemas/GithubUserSummary' },
                {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    name: { type: ['string', 'null'] },
                    company: { type: ['string', 'null'] },
                    blog: { type: 'string' },
                    location: { type: ['string', 'null'] },
                    email: { type: ['string', 'null'] },
                    bio: { type: ['string', 'null'] },
                    hireable: { type: ['boolean', 'null'] },
                    twitter_username: { type: ['string', 'null'] },
                    public_repos: { type: 'integer', minimum: 0 },
                    public_gists: { type: 'integer', minimum: 0 },
                    followers: { type: 'integer', minimum: 0 },
                    following: { type: 'integer', minimum: 0 },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                  },
                },
              ],
            },
          },
        },
      },
      304: { $ref: '#/components/responses/GithubNotModified' },
      default: { $ref: '#/components/responses/GithubError' },
    },
    $global: {
      components: {
        parameters: {
          GithubUsername: {
            name: 'username',
            in: 'path',
            required: true,
            description: 'The GitHub username, case-insensitive.',
            'x-i18n': {
              'zh-CN': { description: 'GitHub 用户名，不区分大小写。' },
              'zh-TW': { description: 'GitHub 使用者名稱，不區分大小寫。' },
              ja: { description: 'GitHub ユーザー名。大文字と小文字は区別されません。' },
              ko: { description: 'GitHub 사용자 이름. 대소문자를 구분하지 않습니다.' },
            },
            schema: { type: 'string' },
            example: 'octocat',
          },
        },
        schemas: {
          GithubUserSummary: {
            type: 'object',
            additionalProperties: true,
            required: ['login', 'id'],
            properties: {
              login: { type: 'string' },
              id: { type: 'integer' },
              node_id: { type: 'string' },
              avatar_url: { type: 'string', format: 'uri' },
              html_url: { type: 'string', format: 'uri' },
              type: { type: 'string' },
              site_admin: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubUserPath(event),
    resource: 'core',
  })
})
