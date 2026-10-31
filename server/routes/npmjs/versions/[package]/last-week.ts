import { defineEventHandler } from 'h3'
import { getNpmjsPackagePath, proxyNpmjsRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['npmjs Downloads'],
    summary: 'Get download counts by package version',
    description:
      'Returns the original download counts by npm package version for the previous seven days. Other periods are not supported.',
    'x-docs': {
      platform: 'npmjs',
      category: 'downloads',
      endpoint: 'versions-last-week',
      order: 180,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['npmjs 下载量'],
        summary: '获取各版本下载量',
        description: '返回 npm 依赖包各版本最近七天的原始下载量，不支持其他周期。',
      },
      'zh-TW': {
        tags: ['npmjs 下載統計'],
        summary: '取得各版本下載量',
        description: '傳回 npm 套件各版本最近七天的原始下載量，不支援其他期間。',
      },
      ja: {
        tags: ['npmjs ダウンロード統計'],
        summary: 'バージョン別のダウンロード数を取得',
        description:
          '過去 7 日間の npm パッケージの元のバージョン別ダウンロード数を返します。他の期間には対応していません。',
      },
      ko: {
        tags: ['npmjs 다운로드 통계'],
        summary: '버전별 다운로드 수 조회',
        description:
          '최근 7일간 npm 패키지의 원본 버전별 다운로드 수를 반환합니다. 다른 기간은 지원하지 않습니다.',
      },
    },
    externalDocs: { url: 'https://github.com/npm/registry/blob/main/docs/download-counts.md' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/NpmjsPackage' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'The package name and download counts keyed by version.',
        'x-i18n': {
          'zh-CN': { description: '依赖包名称和以版本号为键的下载量。' },
          'zh-TW': { description: '套件名稱和以版本號為索引鍵的下載量。' },
          ja: { description: 'パッケージ名とバージョン番号をキーにしたダウンロード数。' },
          ko: { description: '패키지 이름과 버전 번호를 키로 하는 다운로드 수.' },
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              required: ['package', 'downloads'],
              properties: {
                package: { type: 'string' },
                downloads: {
                  type: 'object',
                  additionalProperties: { type: 'integer', minimum: 0 },
                },
              },
            },
          },
        },
      },
      304: { $ref: '#/components/responses/NpmjsNotModified' },
      default: { $ref: '#/components/responses/NpmjsError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyNpmjsRequest(event, `versions/${getNpmjsPackagePath(event)}/last-week`)
})
