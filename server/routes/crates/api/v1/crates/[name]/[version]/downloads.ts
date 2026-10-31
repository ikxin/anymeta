import { defineEventHandler } from 'h3'
import { getCratesVersionPath, proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Downloads'],
    summary: 'Get crate version download counts',
    description:
      'Returns original daily download counts for one crate version over the last 90 days.',
    'x-docs': {
      platform: 'crates',
      category: 'downloads',
      endpoint: 'version',
      order: 300,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 下载量'],
        summary: '获取依赖包版本下载量',
        description: '返回依赖包指定版本最近 90 天的原始每日下载量。',
      },
      'zh-TW': {
        tags: ['crates.io 下載量'],
        summary: '取得套件版本下載量',
        description: '傳回套件指定版本最近 90 天的原始每日下載量。',
      },
      ja: {
        tags: ['crates.io ダウンロード数'],
        summary: 'バージョンのダウンロード数を取得',
        description: '指定したパッケージバージョンの過去 90 日間の日別ダウンロード数を返します。',
      },
      ko: {
        tags: ['crates.io 다운로드 수'],
        summary: '패키지 버전 다운로드 수 조회',
        description: '지정한 패키지 버전의 최근 90일간 원본 일별 다운로드 수를 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/rust-lang/crates.io/blob/main/src/controllers/version/downloads.rs',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/CratesName' },
      { $ref: '#/components/parameters/CratesVersion' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'The original upstream response.',
        'x-i18n': {
          'zh-CN': { description: '上游原始响应。' },
          'zh-TW': { description: '上游原始回應。' },
          ja: { description: '上流の元のレスポンス。' },
          ko: { description: '업스트림 원본 응답.' },
        },
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/CratesDownloads' } },
        },
      },
      304: { $ref: '#/components/responses/CratesNotModified' },
      default: { $ref: '#/components/responses/CratesError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyCratesRequest(event, {
    path: getCratesVersionPath(event, 'downloads'),
  })
})
