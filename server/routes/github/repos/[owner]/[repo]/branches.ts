import { defineEventHandler } from 'h3'
import { getGithubRepositoryPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Repository'],
    summary: 'List repository branches',
    description:
      'Lists branches of a public repository, including commit hashes and protection status.',
    'x-docs': {
      platform: 'github',
      category: 'repos',
      endpoint: 'branches',
      order: 71,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 仓库'],
        summary: '列出仓库分支',
        description: '列出公开仓库的分支，包括提交哈希和保护状态。',
      },
      'zh-TW': {
        tags: ['GitHub 儲存庫'],
        summary: '列出儲存庫分支',
        description: '列出公開儲存庫的分支，包括提交雜湊和保護狀態。',
      },
      ja: {
        tags: ['GitHub リポジトリ'],
        summary: 'リポジトリのブランチ一覧を取得',
        description: '公開リポジトリのブランチ、コミットハッシュ、保護状態を返します。',
      },
      ko: {
        tags: ['GitHub 저장소'],
        summary: '저장소 브랜치 목록 조회',
        description: '공개 저장소의 브랜치, 커밋 해시 및 보호 상태를 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/branches/branches#list-branches' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'protected',
        in: 'query',
        description: 'Filter by branch protection status.',
        'x-i18n': {
          'zh-CN': { description: '按分支保护状态筛选。' },
          'zh-TW': { description: '依分支保護狀態篩選。' },
          ja: { description: 'ブランチ保護状態で絞り込みます。' },
          ko: { description: '브랜치 보호 상태로 필터링합니다.' },
        },
        schema: { type: 'boolean' },
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
                  protected: { type: 'boolean' },
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
    path: getGithubRepositoryPath(event, 'branches'),
    resource: 'core',
  })
})
