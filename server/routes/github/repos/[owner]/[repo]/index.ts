import { defineEventHandler } from 'h3'
import { getGithubRepositoryPath, proxyGithubRequest } from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'getGithubRepository',
    tags: ['GitHub Repository'],
    summary: 'Get a repository',
    description: 'Returns metadata for a public GitHub repository.',
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 仓库'],
        summary: '获取仓库信息',
        description: '返回公开 GitHub 仓库的元数据。',
      },
      'zh-TW': {
        tags: ['GitHub 儲存庫'],
        summary: '取得儲存庫資訊',
        description: '傳回公開 GitHub 儲存庫的中繼資料。',
      },
      ja: {
        tags: ['GitHub リポジトリ'],
        summary: 'リポジトリ情報を取得',
        description: '公開 GitHub リポジトリのメタデータを返します。',
      },
      ko: {
        tags: ['GitHub 저장소'],
        summary: '저장소 정보 조회',
        description: '공개 GitHub 저장소의 메타데이터를 반환합니다.',
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
      url: 'https://docs.github.com/rest/repos/repos#get-a-repository',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'Repository metadata.',
        'x-i18n': {
          'zh-CN': { description: '仓库元数据。' },
          'zh-TW': { description: '儲存庫中繼資料。' },
          ja: { description: 'リポジトリのメタデータ。' },
          ko: { description: '저장소 메타데이터.' },
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              required: ['id', 'name', 'full_name', 'private', 'owner', 'html_url', 'url'],
              properties: {
                id: { type: 'integer' },
                node_id: { type: 'string' },
                name: { type: 'string' },
                full_name: { type: 'string' },
                private: { type: 'boolean' },
                owner: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    login: { type: 'string' },
                    id: { type: 'integer' },
                    avatar_url: { type: 'string', format: 'uri' },
                    html_url: { type: 'string', format: 'uri' },
                  },
                },
                html_url: { type: 'string', format: 'uri' },
                url: { type: 'string', format: 'uri' },
                description: { type: ['string', 'null'] },
                fork: { type: 'boolean' },
                stargazers_count: { type: 'integer' },
                forks_count: { type: 'integer' },
                open_issues_count: { type: 'integer' },
                default_branch: { type: 'string' },
                topics: {
                  type: 'array',
                  items: { type: 'string' },
                },
                visibility: { type: 'string' },
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
    path: getGithubRepositoryPath(event),
    resource: 'core',
  })
})
