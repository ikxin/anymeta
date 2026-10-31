import { defineEventHandler } from 'h3'
import { getGithubOrganizationPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Organization'],
    summary: 'List public organization members',
    description: 'Lists publicly visible members of a GitHub organization with pagination.',
    'x-docs': {
      platform: 'github',
      category: 'orgs',
      endpoint: 'members',
      order: 31,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 组织'],
        summary: '列出组织公开成员',
        description: '分页列出 GitHub 组织中公开可见的成员。',
      },
      'zh-TW': {
        tags: ['GitHub 組織'],
        summary: '列出組織公開成員',
        description: '分頁列出 GitHub 組織中公開可見的成員。',
      },
      ja: {
        tags: ['GitHub 組織'],
        summary: '組織の公開メンバー一覧を取得',
        description: 'GitHub 組織の公開メンバーをページ分割で返します。',
      },
      ko: {
        tags: ['GitHub 조직'],
        summary: '조직의 공개 멤버 목록 조회',
        description: 'GitHub 조직의 공개 멤버를 페이지별로 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/orgs/members#list-organization-members' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOrganization' },
      {
        name: 'role',
        in: 'query',
        description: 'Filter by organization role.',
        'x-i18n': {
          'zh-CN': { description: '按组织角色筛选。' },
          'zh-TW': { description: '依組織角色篩選。' },
          ja: { description: '組織の役割で絞り込みます。' },
          ko: { description: '조직 역할로 필터링합니다.' },
        },
        schema: { type: 'string', enum: ['all', 'admin', 'member'], default: 'all' },
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
    path: getGithubOrganizationPath(event, 'members'),
    resource: 'core',
  })
})
