import { defineEventHandler } from 'h3'
import { getGithubRepositoryPath, proxyGithubRequest } from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Repository'],
    summary: 'List repository contributors',
    description:
      'Lists contributors to a public GitHub repository, sorted by contribution count in descending order.',
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 仓库'],
        summary: '列出仓库贡献者',
        description: '列出公开 GitHub 仓库的贡献者，按贡献次数降序排列。',
      },
      'zh-TW': {
        tags: ['GitHub 儲存庫'],
        summary: '列出儲存庫貢獻者',
        description: '列出公開 GitHub 儲存庫的貢獻者，依貢獻次數遞減排序。',
      },
      ja: {
        tags: ['GitHub リポジトリ'],
        summary: 'リポジトリのコントリビューターを取得',
        description:
          '公開 GitHub リポジトリのコントリビューターを、貢献回数の降順で一覧表示します。',
      },
      ko: {
        tags: ['GitHub 저장소'],
        summary: '저장소 기여자 목록 조회',
        description: '공개 GitHub 저장소의 기여자를 기여 횟수가 많은 순으로 나열합니다.',
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
      url: 'https://docs.github.com/rest/repos/repos#list-repository-contributors',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'anon',
        in: 'query',
        description: 'Set to 1 or true to include anonymous contributors.',
        'x-i18n': {
          'zh-CN': { description: '设为 1 或 true 可包含匿名贡献者。' },
          'zh-TW': { description: '設為 1 或 true 可包含匿名貢獻者。' },
          ja: { description: '匿名のコントリビューターを含めるには 1 または true を指定します。' },
          ko: { description: '익명 기여자를 포함하려면 1 또는 true로 설정합니다.' },
        },
        schema: {
          type: 'string',
          enum: ['1', 'true'],
        },
      },
      { $ref: '#/components/parameters/GithubPerPage' },
      { $ref: '#/components/parameters/GithubPage' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'Contributor list.',
        'x-i18n': {
          'zh-CN': { description: '贡献者列表。' },
          'zh-TW': { description: '貢獻者清單。' },
          ja: { description: 'コントリビューターの一覧。' },
          ko: { description: '기여자 목록.' },
        },
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                required: ['contributions'],
                properties: {
                  login: { type: 'string' },
                  id: { type: 'integer' },
                  avatar_url: { type: 'string', format: 'uri' },
                  html_url: { type: 'string', format: 'uri' },
                  type: { type: 'string' },
                  contributions: { type: 'integer', minimum: 0 },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
      204: {
        description: 'The repository is empty.',
        'x-i18n': {
          'zh-CN': { description: '仓库为空。' },
          'zh-TW': { description: '儲存庫為空。' },
          ja: { description: 'リポジトリは空です。' },
          ko: { description: '저장소가 비어 있습니다.' },
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
    path: getGithubRepositoryPath(event, 'contributors'),
    resource: 'core',
  })
})
