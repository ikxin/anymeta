import { defineEventHandler } from 'h3'
import { getNpmjsDownloadsPath, proxyNpmjsRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['npmjs Downloads'],
    summary: 'Get daily package download counts',
    description:
      'Returns the original daily npm download counts for a period. Supports single scoped packages and comma-separated unscoped package names.',
    'x-docs': {
      platform: 'npmjs',
      category: 'downloads',
      endpoint: 'range',
      order: 160,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['npmjs 下载量'],
        summary: '获取依赖包每日下载量',
        description:
          '返回指定周期的 npm 原始每日下载统计，支持单个作用域依赖包，以及用逗号分隔的多个普通依赖包名称。',
      },
      'zh-TW': {
        tags: ['npmjs 下載統計'],
        summary: '取得套件每日下載量',
        description:
          '傳回指定期間的 npm 原始每日下載統計，支援單個範圍套件，以及用逗號分隔的多個一般套件名稱。',
      },
      ja: {
        tags: ['npmjs ダウンロード統計'],
        summary: 'パッケージの日別ダウンロード数を取得',
        description:
          '指定期間の npm の日別ダウンロード統計をそのまま返します。単一のスコープ付きパッケージと、カンマ区切りの通常の名前に対応します。',
      },
      ko: {
        tags: ['npmjs 다운로드 통계'],
        summary: '패키지 일별 다운로드 수 조회',
        description:
          '지정한 기간의 npm 원본 일별 다운로드 통계를 반환합니다. 단일 범위 패키지와 쉼표로 구분한 일반 이름을 지원합니다.',
      },
    },
    externalDocs: { url: 'https://github.com/npm/registry/blob/main/docs/download-counts.md' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/NpmjsDownloadPeriod' },
      { $ref: '#/components/parameters/NpmjsDownloadPackages' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'The original daily download counts or bulk result keyed by package name.',
        'x-i18n': {
          'zh-CN': { description: '原始每日下载统计，或以依赖包名称为键的批量统计结果。' },
          'zh-TW': { description: '原始每日下載統計，或以套件名稱為索引鍵的批次統計結果。' },
          ja: { description: '元の日別ダウンロード統計、または名前をキーにした一括結果。' },
          ko: { description: '원본 일별 다운로드 통계 또는 패키지 이름을 키로 하는 일괄 결과.' },
        },
        content: {
          'application/json': {
            schema: {
              oneOf: [
                { $ref: '#/components/schemas/NpmjsDownloadRange' },
                {
                  type: 'object',
                  additionalProperties: {
                    anyOf: [{ $ref: '#/components/schemas/NpmjsDownloadRange' }, { type: 'null' }],
                  },
                },
              ],
            },
          },
        },
      },
      304: { $ref: '#/components/responses/NpmjsNotModified' },
      default: { $ref: '#/components/responses/NpmjsError' },
    },
    $global: {
      components: {
        schemas: {
          NpmjsDownloadRange: {
            type: 'object',
            additionalProperties: true,
            required: ['downloads', 'start', 'end'],
            properties: {
              downloads: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                  required: ['day', 'downloads'],
                  properties: {
                    day: { type: 'string', format: 'date' },
                    downloads: { type: 'integer', minimum: 0 },
                  },
                },
              },
              start: { type: 'string', format: 'date' },
              end: { type: 'string', format: 'date' },
              package: { type: 'string' },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyNpmjsRequest(event, getNpmjsDownloadsPath(event, 'range'))
})
