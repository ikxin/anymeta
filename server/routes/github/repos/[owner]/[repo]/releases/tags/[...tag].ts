import { defineEventHandler } from 'h3'
import { getGithubRepositoryRefPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Releases'],
    summary: 'Get a release by tag',
    description:
      'Returns a published release matching a Git tag, including its asset metadata and download counts.',
    'x-docs': {
      platform: 'github',
      category: 'releases',
      endpoint: 'tag',
      order: 91,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 发行版本'],
        summary: '按标签获取发行版本',
        description: '返回指定 Git 标签对应的已发布发行版本，包括资源文件元数据和下载次数。',
      },
      'zh-TW': {
        tags: ['GitHub 發行版本'],
        summary: '依標籤取得發行版本',
        description: '傳回指定 Git 標籤對應的已發行版本，包括資源檔案中繼資料和下載次數。',
      },
      ja: {
        tags: ['GitHub リリース'],
        summary: 'タグからリリースを取得',
        description: '指定した Git タグの公開リリースとアセットのメタデータ、ダウンロード数を返します。',
      },
      ko: {
        tags: ['GitHub 릴리스'],
        summary: '태그로 릴리스 조회',
        description: '지정한 Git 태그의 게시된 릴리스와 자산 메타데이터 및 다운로드 수를 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://docs.github.com/rest/releases/releases#get-a-release-by-tag-name',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'tag',
        in: 'path',
        required: true,
        description: 'The release tag name. Slash-containing tags are supported.',
        'x-i18n': {
          'zh-CN': { description: '发行版本的标签名，支持包含斜杠的标签。' },
          'zh-TW': { description: '發行版本的標籤名稱，支援包含斜線的標籤。' },
          ja: { description: 'リリースのタグ名。スラッシュを含むタグに対応します。' },
          ko: { description: '릴리스 태그 이름. 슬래시가 포함된 태그를 지원합니다.' },
        },
        schema: { type: 'string' },
        example: 'v1.0.0',
      },
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
                author: { $ref: '#/components/schemas/GithubUserSummary' },
                created_at: { type: 'string', format: 'date-time' },
                published_at: { type: ['string', 'null'], format: 'date-time' },
                html_url: { type: 'string', format: 'uri' },
                tarball_url: { anyOf: [{ type: 'string', format: 'uri' }, { type: 'null' }] },
                zipball_url: { anyOf: [{ type: 'string', format: 'uri' }, { type: 'null' }] },
                assets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      label: { type: ['string', 'null'] },
                      content_type: { type: 'string' },
                      size: { type: 'integer', minimum: 0 },
                      download_count: { type: 'integer', minimum: 0 },
                      browser_download_url: { type: 'string', format: 'uri' },
                      created_at: { type: 'string', format: 'date-time' },
                      updated_at: { type: 'string', format: 'date-time' },
                    },
                  },
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
    path: getGithubRepositoryRefPath(event, 'releases/tags'),
    resource: 'core',
  })
})
