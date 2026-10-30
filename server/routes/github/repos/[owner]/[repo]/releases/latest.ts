import { defineEventHandler } from 'h3'
import { getGithubRepositoryPath, proxyGithubRequest } from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'getGithubLatestRelease',
    tags: ['GitHub Repository'],
    summary: 'Get the latest release',
    description:
      'Returns the original latest published full release from GitHub, excluding drafts and prereleases.',
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 仓库'],
        summary: '获取最新发行版本',
        description: '返回 GitHub 原始的最新正式发行版本，不包含草稿和预发布版本。',
      },
      'zh-TW': {
        tags: ['GitHub 儲存庫'],
        summary: '取得最新發行版本',
        description: '傳回 GitHub 原始的最新正式發行版本，不包含草稿和預先發行版本。',
      },
      ja: {
        tags: ['GitHub リポジトリ'],
        summary: '最新リリースを取得',
        description: '下書きとプレリリースを除く GitHub の最新正式リリースをそのまま返します。',
      },
      ko: {
        tags: ['GitHub 저장소'],
        summary: '최신 릴리스 조회',
        description: '초안과 사전 릴리스를 제외한 GitHub의 최신 정식 릴리스를 그대로 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/releases/releases#get-the-latest-release' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'The original release object.',
        'x-i18n': {
          'zh-CN': { description: '原始发行版本对象。' },
          'zh-TW': { description: '原始發行版本物件。' },
          ja: { description: '元のリリースオブジェクト。' },
          ko: { description: '원본 릴리스 객체.' },
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              properties: {
                id: { type: 'integer' },
                tag_name: { type: 'string' },
                target_commitish: { type: 'string' },
                name: { type: ['string', 'null'] },
                body: { type: ['string', 'null'] },
                draft: { type: 'boolean' },
                prerelease: { type: 'boolean' },
                immutable: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' },
                published_at: { type: ['string', 'null'], format: 'date-time' },
                html_url: { type: 'string', format: 'uri' },
                tarball_url: { type: ['string', 'null'], format: 'uri' },
                zipball_url: { type: ['string', 'null'], format: 'uri' },
                assets: { type: 'array', items: { type: 'object', additionalProperties: true } },
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
    path: getGithubRepositoryPath(event, 'releases/latest'),
    resource: 'core',
  })
})
