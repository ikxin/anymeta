import { defineEventHandler } from 'h3'
import { getGithubUserPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Users'],
    summary: 'List public user organizations',
    description:
      'Lists organizations where the user has public membership. Hidden memberships are not included.',
    'x-docs': {
      platform: 'github',
      category: 'users',
      endpoint: 'orgs',
      order: 15,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 用户'],
        summary: '列出用户公开组织',
        description: '列出用户公开展示成员身份的组织，不包含隐藏的组织成员关系。',
      },
      'zh-TW': {
        tags: ['GitHub 使用者'],
        summary: '列出使用者公開組織',
        description: '列出使用者公開顯示成員身分的組織，不包含隱藏的組織成員關係。',
      },
      ja: {
        tags: ['GitHub ユーザー'],
        summary: 'ユーザーの公開組織一覧を取得',
        description: 'ユーザーが所属を公開している組織を返します。非公開の所属情報は含みません。',
      },
      ko: {
        tags: ['GitHub 사용자'],
        summary: '사용자의 공개 조직 목록 조회',
        description: '사용자가 멤버십을 공개한 조직을 반환합니다. 비공개 멤버십은 포함하지 않습니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/orgs/orgs#list-organizations-for-a-user' },
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
            schema: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  login: { type: 'string' },
                  id: { type: 'integer' },
                  avatar_url: { type: 'string', format: 'uri' },
                  description: { type: ['string', 'null'] },
                  url: { type: 'string', format: 'uri' },
                },
              },
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
    path: getGithubUserPath(event, 'orgs'),
    resource: 'core',
  })
})
