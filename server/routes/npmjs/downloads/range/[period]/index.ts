import { defineEventHandler } from 'h3'
import { getNpmjsDownloadsPath, proxyNpmjsRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['npmjs Downloads'],
    summary: 'Get daily registry download counts',
    description: 'Returns the original daily download counts across all npm packages for a period.',
    'x-docs': {
      platform: 'npmjs',
      category: 'downloads',
      endpoint: 'range-all',
      order: 170,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['npmjs 下载量'],
        summary: '获取全站每日下载量',
        description: '返回指定周期内所有 npm 依赖包的原始每日下载统计。',
      },
      'zh-TW': {
        tags: ['npmjs 下載統計'],
        summary: '取得全站每日下載量',
        description: '傳回指定期間內所有 npm 套件的原始每日下載統計。',
      },
      ja: {
        tags: ['npmjs ダウンロード統計'],
        summary: 'レジストリ全体の日別ダウンロード数を取得',
        description: '指定期間の全 npm パッケージの元の日別ダウンロード統計を返します。',
      },
      ko: {
        tags: ['npmjs 다운로드 통계'],
        summary: '전체 레지스트리 일별 다운로드 수 조회',
        description: '지정한 기간의 모든 npm 패키지에 대한 원본 일별 다운로드 통계를 반환합니다.',
      },
    },
    externalDocs: { url: 'https://github.com/npm/registry/blob/main/docs/download-counts.md' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/NpmjsDownloadPeriod' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'The original daily download counts, without a package field.',
        'x-i18n': {
          'zh-CN': { description: '原始每日下载统计，不包含 package 字段。' },
          'zh-TW': { description: '原始每日下載統計，不包含 package 欄位。' },
          ja: { description: 'package フィールドを含まない元の日別ダウンロード統計。' },
          ko: { description: 'package 필드를 포함하지 않는 원본 일별 다운로드 통계.' },
        },
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/NpmjsDownloadRange' } },
        },
      },
      304: { $ref: '#/components/responses/NpmjsNotModified' },
      default: { $ref: '#/components/responses/NpmjsError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyNpmjsRequest(event, getNpmjsDownloadsPath(event, 'range'))
})
