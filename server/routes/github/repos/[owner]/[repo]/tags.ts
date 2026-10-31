import { defineEventHandler } from 'h3'
import { getGithubRepositoryPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Repository'],
    summary: 'List repository tags',
    description: 'Lists Git tags and their commit hashes. Tags do not need an associated release.',
    'x-docs': {
      platform: 'github',
      category: 'repos',
      endpoint: 'tags',
      order: 72,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 仓库'],
        summary: '列出仓库标签',
        description: '列出 Git 标签及其提交哈希，标签无需关联发行版本。',
      },
      'zh-TW': {
        tags: ['GitHub 儲存庫'],
        summary: '列出儲存庫標籤',
        description: '列出 Git 標籤及其提交雜湊，標籤不必關聯發行版本。',
      },
      ja: {
        tags: ['GitHub リポジトリ'],
        summary: 'リポジトリのタグ一覧を取得',
        description: 'Git タグとコミットハッシュを返します。リリースに関連付けられていないタグも含みます。',
      },
      ko: {
        tags: ['GitHub 저장소'],
        summary: '저장소 태그 목록 조회',
        description: 'Git 태그와 커밋 해시를 반환합니다. 릴리스와 연결되지 않은 태그도 포함합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/repos/repos#list-repository-tags' },
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
            schema: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  name: { type: 'string' },
                  commit: {
                    type: 'object',
                    additionalProperties: true,
                    properties: { sha: { type: 'string' }, url: { type: 'string', format: 'uri' } },
                  },
                  zipball_url: { type: 'string', format: 'uri' },
                  tarball_url: { type: 'string', format: 'uri' },
                  node_id: { type: 'string' },
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
    path: getGithubRepositoryPath(event, 'tags'),
    resource: 'core',
  })
})
