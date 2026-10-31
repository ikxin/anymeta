import { defineEventHandler } from 'h3'
import { getGithubOrganizationPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Organization'],
    summary: 'Get an organization',
    description:
      'Returns the original public organization metadata from GitHub, including its follower count.',
    'x-docs': {
      platform: 'github',
      category: 'orgs',
      endpoint: 'get',
      order: 20,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 组织'],
        summary: '获取组织信息',
        description: '返回 GitHub 原始的公开组织元数据，包括关注者数量。',
      },
      'zh-TW': {
        tags: ['GitHub 組織'],
        summary: '取得組織資訊',
        description: '傳回 GitHub 原始的公開組織中繼資料，包括追蹤者數量。',
      },
      ja: {
        tags: ['GitHub 組織'],
        summary: '組織情報を取得',
        description: 'フォロワー数を含む GitHub の公開組織メタデータをそのまま返します。',
      },
      ko: {
        tags: ['GitHub 조직'],
        summary: '조직 정보 조회',
        description: '팔로워 수를 포함한 GitHub의 공개 조직 메타데이터를 그대로 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/orgs/orgs#get-an-organization' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOrganization' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'Public organization metadata.',
        'x-i18n': {
          'zh-CN': { description: '公开组织元数据。' },
          'zh-TW': { description: '公開組織中繼資料。' },
          ja: { description: '公開組織のメタデータ。' },
          ko: { description: '공개 조직 메타데이터.' },
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              properties: {
                login: { type: 'string' },
                id: { type: 'integer' },
                name: { type: ['string', 'null'] },
                description: { type: ['string', 'null'] },
                avatar_url: { type: 'string', format: 'uri' },
                html_url: { type: 'string', format: 'uri' },
                blog: { type: ['string', 'null'] },
                public_repos: { type: 'integer' },
                followers: { type: 'integer' },
                following: { type: 'integer' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
              },
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
          GithubOrganization: {
            name: 'org',
            in: 'path',
            required: true,
            description: 'The organization login. The value is case-insensitive.',
            'x-i18n': {
              'zh-CN': { description: '组织的登录名，不区分大小写。' },
              'zh-TW': { description: '組織的登入名稱，不區分大小寫。' },
              ja: { description: '組織のログイン名。大文字と小文字は区別されません。' },
              ko: { description: '조직의 로그인 이름입니다. 대소문자를 구분하지 않습니다.' },
            },
            schema: { type: 'string' },
            example: 'unjs',
          },
        },
        responses: {
          GithubNotModified: {
            description: 'Not modified.',
            'x-i18n': {
              'zh-CN': { description: '内容未修改。' },
              'zh-TW': { description: '內容未修改。' },
              ja: { description: '変更されていません。' },
              ko: { description: '변경되지 않았습니다.' },
            },
          },
          GithubError: {
            description: 'The original GitHub error or an AnyMeta proxy error.',
            'x-i18n': {
              'zh-CN': { description: 'GitHub 原始错误或 AnyMeta 代理错误。' },
              'zh-TW': { description: 'GitHub 原始錯誤或 AnyMeta 代理錯誤。' },
              ja: { description: 'GitHub の元のエラーまたは AnyMeta のプロキシエラー。' },
              ko: { description: 'GitHub 원본 오류 또는 AnyMeta 프록시 오류.' },
            },
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/GithubProxyError' } },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubOrganizationPath(event),
    resource: 'core',
  })
})
