import { defineEventHandler } from 'h3'
import { getNpmjsDownloadsPath, proxyNpmjsRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['npmjs Downloads'],
    summary: 'Get total registry download counts',
    description: 'Returns the original total download count across all npm packages for a period.',
    'x-docs': {
      platform: 'npmjs',
      category: 'downloads',
      endpoint: 'point-all',
      order: 150,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['npmjs 下载量'],
        summary: '获取全站下载量',
        description: '返回指定周期内所有 npm 依赖包的原始下载总量。',
      },
      'zh-TW': {
        tags: ['npmjs 下載統計'],
        summary: '取得全站下載量',
        description: '傳回指定期間內所有 npm 套件的原始下載總量。',
      },
      ja: {
        tags: ['npmjs ダウンロード統計'],
        summary: 'レジストリ全体のダウンロード数を取得',
        description: '指定期間の全 npm パッケージの元のダウンロード総数を返します。',
      },
      ko: {
        tags: ['npmjs 다운로드 통계'],
        summary: '전체 레지스트리 다운로드 수 조회',
        description: '지정한 기간의 모든 npm 패키지에 대한 원본 총 다운로드 수를 반환합니다.',
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
        description: 'The original total download count, without a package field.',
        'x-i18n': {
          'zh-CN': { description: '原始下载总量，不包含 package 字段。' },
          'zh-TW': { description: '原始下載總量，不包含 package 欄位。' },
          ja: { description: 'package フィールドを含まない元のダウンロード総数。' },
          ko: { description: 'package 필드를 포함하지 않는 원본 총 다운로드 수.' },
        },
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/NpmjsDownloadCount' } },
        },
      },
      304: { $ref: '#/components/responses/NpmjsNotModified' },
      default: { $ref: '#/components/responses/NpmjsError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyNpmjsRequest(event, getNpmjsDownloadsPath(event, 'point'))
})
