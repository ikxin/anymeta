import { defineEventHandler } from 'h3'
import { getGithubOrganizationPath, proxyGithubRequest } from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Organization'],
    summary: 'List organization repositories',
    description:
      'Returns the original paginated repository array from GitHub. No star totals or other aggregates are added.',
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 组织'],
        summary: '列出组织仓库',
        description: '返回 GitHub 原始的分页仓库数组，不额外计算 Stars 总数等汇总数据。',
      },
      'zh-TW': {
        tags: ['GitHub 組織'],
        summary: '列出組織儲存庫',
        description: '傳回 GitHub 原始的分頁儲存庫陣列，不額外計算 Stars 總數等彙總資料。',
      },
      ja: {
        tags: ['GitHub 組織'],
        summary: '組織のリポジトリ一覧を取得',
        description:
          'GitHub のページ分割されたリポジトリ配列をそのまま返します。スター数などの集計は追加しません。',
      },
      ko: {
        tags: ['GitHub 조직'],
        summary: '조직 저장소 목록 조회',
        description:
          'GitHub의 페이지별 저장소 배열을 그대로 반환하며 스타 합계 등의 집계를 추가하지 않습니다.',
      },
    },
    externalDocs: {
      url: 'https://docs.github.com/rest/repos/repos#list-organization-repositories',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOrganization' },
      {
        name: 'type',
        in: 'query',
        description: 'The types of repositories to return.',
        'x-i18n': {
          'zh-CN': { description: '要返回的仓库类型。' },
          'zh-TW': { description: '要傳回的儲存庫類型。' },
          ja: { description: '返すリポジトリの種類。' },
          ko: { description: '반환할 저장소 유형.' },
        },
        schema: {
          type: 'string',
          enum: ['all', 'public', 'private', 'forks', 'sources', 'member'],
          default: 'all',
        },
      },
      {
        name: 'sort',
        in: 'query',
        description: 'The property to sort by.',
        'x-i18n': {
          'zh-CN': { description: '排序字段。' },
          'zh-TW': { description: '排序欄位。' },
          ja: { description: '並べ替えに使う項目。' },
          ko: { description: '정렬 기준 속성.' },
        },
        schema: {
          type: 'string',
          enum: ['created', 'updated', 'pushed', 'full_name'],
          default: 'created',
        },
      },
      {
        name: 'direction',
        in: 'query',
        description: 'Sort direction. Defaults to asc for full_name and desc otherwise.',
        'x-i18n': {
          'zh-CN': { description: '排序方向。按 full_name 排序时默认升序，其他情况默认降序。' },
          'zh-TW': { description: '排序方向。依 full_name 排序時預設遞增，其他情況預設遞減。' },
          ja: { description: '並び順。full_name では昇順、それ以外では降順が既定です。' },
          ko: { description: '정렬 방향. full_name은 기본 오름차순이며 나머지는 내림차순입니다.' },
        },
        schema: { type: 'string', enum: ['asc', 'desc'] },
      },
      { $ref: '#/components/parameters/GithubPerPage' },
      { $ref: '#/components/parameters/GithubPage' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'The original repository array.',
        'x-i18n': {
          'zh-CN': { description: '原始仓库数组。' },
          'zh-TW': { description: '原始儲存庫陣列。' },
          ja: { description: '元のリポジトリ配列。' },
          ko: { description: '원본 저장소 배열.' },
        },
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  full_name: { type: 'string' },
                  private: { type: 'boolean' },
                  description: { type: ['string', 'null'] },
                  html_url: { type: 'string', format: 'uri' },
                  stargazers_count: { type: 'integer' },
                  forks_count: { type: 'integer' },
                  default_branch: { type: 'string' },
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
    path: getGithubOrganizationPath(event, 'repos'),
    resource: 'core',
  })
})
