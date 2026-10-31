import { defineEventHandler, getRequestHeader } from 'h3'
import { getGithubRepositoryPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Repository'],
    summary: 'Get a repository README',
    description:
      'Returns the original GitHub README response. JSON content remains Base64-encoded; raw and HTML media types are also supported.',
    'x-docs': {
      platform: 'github',
      category: 'repos',
      endpoint: 'readme',
      order: 70,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 仓库'],
        summary: '获取仓库 README',
        description:
          '返回 GitHub 原始 README 响应。JSON 中的内容保留 Base64 编码，也支持原文和 HTML 媒体类型。',
      },
      'zh-TW': {
        tags: ['GitHub 儲存庫'],
        summary: '取得儲存庫 README',
        description:
          '傳回 GitHub 原始 README 回應。JSON 中的內容保留 Base64 編碼，也支援原文和 HTML 媒體類型。',
      },
      ja: {
        tags: ['GitHub リポジトリ'],
        summary: 'リポジトリの README を取得',
        description:
          'GitHub の README レスポンスをそのまま返します。JSON の内容は Base64 のまま保持し、原文と HTML も指定できます。',
      },
      ko: {
        tags: ['GitHub 저장소'],
        summary: '저장소 README 조회',
        description:
          'GitHub README 응답을 그대로 반환합니다. JSON 콘텐츠는 Base64로 유지되며 원문과 HTML 미디어 유형도 지원합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/repos/contents#get-a-repository-readme' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'ref',
        in: 'query',
        description: 'A commit, branch, or tag. Defaults to the repository default branch.',
        'x-i18n': {
          'zh-CN': { description: '提交、分支或标签，默认使用仓库的默认分支。' },
          'zh-TW': { description: '提交、分支或標籤，預設使用儲存庫的預設分支。' },
          ja: {
            description:
              'コミット、ブランチ、タグ。既定ではリポジトリのデフォルトブランチを使用します。',
          },
          ko: { description: '커밋, 브랜치 또는 태그. 기본값은 저장소의 기본 브랜치입니다.' },
        },
        schema: { type: 'string' },
      },
      {
        name: 'Accept',
        in: 'header',
        description:
          'Use application/vnd.github+json for metadata, application/vnd.github.raw+json for raw text, or application/vnd.github.html+json for HTML.',
        'x-i18n': {
          'zh-CN': {
            description:
              '使用 application/vnd.github+json 获取元数据，application/vnd.github.raw+json 获取原文，application/vnd.github.html+json 获取 HTML。',
          },
          'zh-TW': {
            description:
              '使用 application/vnd.github+json 取得中繼資料，application/vnd.github.raw+json 取得原文，application/vnd.github.html+json 取得 HTML。',
          },
          ja: {
            description:
              'メタデータは application/vnd.github+json、原文は application/vnd.github.raw+json、HTML は application/vnd.github.html+json を指定します。',
          },
          ko: {
            description:
              '메타데이터는 application/vnd.github+json, 원문은 application/vnd.github.raw+json, HTML은 application/vnd.github.html+json을 사용합니다.',
          },
        },
        schema: { type: 'string', default: 'application/vnd.github+json' },
      },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'The original README response in the requested media type.',
        'x-i18n': {
          'zh-CN': { description: '请求的媒体类型对应的原始 README 响应。' },
          'zh-TW': { description: '要求的媒體類型對應的原始 README 回應。' },
          ja: { description: '指定したメディアタイプによる元の README レスポンス。' },
          ko: { description: '요청한 미디어 유형의 원본 README 응답.' },
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              properties: {
                type: { type: 'string' },
                encoding: { type: 'string' },
                size: { type: 'integer' },
                name: { type: 'string' },
                path: { type: 'string' },
                content: { type: 'string' },
                sha: { type: 'string' },
                url: { type: 'string', format: 'uri' },
                html_url: { type: 'string', format: 'uri' },
                download_url: { type: ['string', 'null'], format: 'uri' },
              },
            },
          },
          'text/plain': { schema: { type: 'string' } },
          'text/html': { schema: { type: 'string' } },
        },
      },
      304: { $ref: '#/components/responses/GithubNotModified' },
      default: { $ref: '#/components/responses/GithubError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubRepositoryPath(event, 'readme'),
    resource: 'core',
    accept: getRequestHeader(event, 'accept'),
  })
})
