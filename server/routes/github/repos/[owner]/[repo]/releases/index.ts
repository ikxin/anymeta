import { defineEventHandler } from 'h3'
import { getGithubRepositoryPath, proxyGithubRequest } from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'listGithubRepositoryReleases',
    tags: ['GitHub Repository'],
    summary: 'List releases',
    description: 'Lists published releases for a public GitHub repository.',
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 仓库'],
        summary: '列出发行版本',
        description: '列出公开 GitHub 仓库已发布的发行版本。',
      },
      'zh-TW': {
        tags: ['GitHub 儲存庫'],
        summary: '列出發行版本',
        description: '列出公開 GitHub 儲存庫已發布的發行版本。',
      },
      ja: {
        tags: ['GitHub リポジトリ'],
        summary: 'リリース一覧を取得',
        description: '公開 GitHub リポジトリの公開済みリリースを一覧表示します。',
      },
      ko: {
        tags: ['GitHub 저장소'],
        summary: '릴리스 목록 조회',
        description: '공개 GitHub 저장소의 게시된 릴리스를 나열합니다.',
      },
    },
    externalDocs: {
      description: 'GitHub REST API documentation',
      'x-i18n': {
        'zh-CN': { description: 'GitHub REST API 文档' },
        'zh-TW': { description: 'GitHub REST API 文件' },
        ja: { description: 'GitHub REST API ドキュメント' },
        ko: { description: 'GitHub REST API 문서' },
      },
      url: 'https://docs.github.com/rest/releases/releases#list-releases',
    },
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
        description: 'Release list.',
        'x-i18n': {
          'zh-CN': { description: '发行版本列表。' },
          'zh-TW': { description: '發行版本清單。' },
          ja: { description: 'リリースの一覧。' },
          ko: { description: '릴리스 목록.' },
        },
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                required: ['id', 'tag_name', 'draft', 'prerelease'],
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
                  assets: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      304: {
        description: 'Not modified.',
        'x-i18n': {
          'zh-CN': { description: '内容未修改。' },
          'zh-TW': { description: '內容未修改。' },
          ja: { description: '変更されていません。' },
          ko: { description: '변경되지 않았습니다.' },
        },
      },
      default: {
        description: 'GitHub or AnyMeta returned an error.',
        'x-i18n': {
          'zh-CN': { description: 'GitHub 或 AnyMeta 返回了错误。' },
          'zh-TW': { description: 'GitHub 或 AnyMeta 傳回了錯誤。' },
          ja: { description: 'GitHub または AnyMeta がエラーを返しました。' },
          ko: { description: 'GitHub 또는 AnyMeta가 오류를 반환했습니다.' },
        },
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/GithubProxyError' },
          },
        },
      },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubRepositoryPath(event, 'releases'),
    resource: 'core',
  })
})
