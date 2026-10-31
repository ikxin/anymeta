import { defineEventHandler } from 'h3'
import { getCratesPackagePath, proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Downloads'],
    summary: 'Get crate download counts',
    description:
      'Returns daily download counts for the last 90 days for the latest five versions, with older versions aggregated in meta.extra_downloads.',
    'x-docs': {
      platform: 'crates',
      category: 'downloads',
      endpoint: 'package',
      order: 290,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 下载量'],
        summary: '获取依赖包下载量',
        description: '返回最近 90 天最新五个版本的每日下载量，其他版本的汇总量位于 meta.extra_downloads。',
      },
      'zh-TW': {
        tags: ['crates.io 下載量'],
        summary: '取得套件下載量',
        description: '傳回最近 90 天最新五個版本的每日下載量，其他版本的彙總量位於 meta.extra_downloads。',
      },
      ja: {
        tags: ['crates.io ダウンロード数'],
        summary: 'パッケージのダウンロード数を取得',
        description: '過去 90 日間の最新 5 バージョンの日別ダウンロード数と、meta.extra_downloads にある旧バージョンの合計を返します。',
      },
      ko: {
        tags: ['crates.io 다운로드 수'],
        summary: '패키지 다운로드 수 조회',
        description: '최근 90일간 최신 5개 버전의 일별 다운로드 수와 meta.extra_downloads의 이전 버전 합계를 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/rust-lang/crates.io/blob/main/src/controllers/krate/downloads.rs',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/CratesName' },
      {
        name: 'include',
        in: 'query',
        description: 'Include version metadata referenced in the download counts.',
        'x-i18n': {
          'zh-CN': { description: '包含下载量记录引用的版本元数据。' },
          'zh-TW': { description: '包含下載量紀錄參照的版本中繼資料。' },
          ja: { description: 'ダウンロード数が参照するバージョンのメタデータを含めます。' },
          ko: { description: '다운로드 수가 참조하는 버전 메타데이터를 포함합니다.' },
        },
        schema: { type: 'string', enum: ['versions'] },
      },
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
    path: getCratesPackagePath(event, 'downloads'),
  })
})
