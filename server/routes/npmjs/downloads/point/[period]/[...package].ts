import { defineEventHandler } from 'h3'
import { getNpmjsDownloadsPointPath, proxyNpmjsRequest } from '#server/utils/npmjs-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'getNpmjsDownloadsPoint',
    tags: ['npmjs Downloads'],
    summary: 'Get package download counts',
    description:
      'Returns the original npm download counts for a period. Supports single scoped packages and comma-separated unscoped package names.',
    'x-i18n': {
      'zh-CN': {
        tags: ['npmjs 下载统计'],
        summary: '获取包下载量',
        description:
          '返回指定周期的 npm 原始下载统计，支持单个作用域包，以及用逗号分隔的多个普通包名。',
      },
      'zh-TW': {
        tags: ['npmjs 下載統計'],
        summary: '取得套件下載量',
        description:
          '傳回指定期間的 npm 原始下載統計，支援單個範圍套件，以及用逗號分隔的多個一般套件名稱。',
      },
      ja: {
        tags: ['npmjs ダウンロード統計'],
        summary: 'パッケージのダウンロード数を取得',
        description:
          '指定期間の npm ダウンロード統計をそのまま返します。単一のスコープ付きパッケージと、カンマ区切りの通常の名前に対応します。',
      },
      ko: {
        tags: ['npmjs 다운로드 통계'],
        summary: '패키지 다운로드 수 조회',
        description:
          '지정한 기간의 npm 원본 다운로드 통계를 반환합니다. 단일 범위 패키지와 쉼표로 구분한 일반 이름을 지원합니다.',
      },
    },
    externalDocs: { url: 'https://github.com/npm/registry/blob/main/docs/download-counts.md' },
    security: [],
    parameters: [
      {
        name: 'period',
        in: 'path',
        required: true,
        description:
          'last-day, last-week, last-month, last-year, YYYY-MM-DD, or YYYY-MM-DD:YYYY-MM-DD.',
        'x-i18n': {
          'zh-CN': {
            description:
              '支持 last-day、last-week、last-month、last-year、YYYY-MM-DD 或 YYYY-MM-DD:YYYY-MM-DD。',
          },
          'zh-TW': {
            description:
              '支援 last-day、last-week、last-month、last-year、YYYY-MM-DD 或 YYYY-MM-DD:YYYY-MM-DD。',
          },
          ja: {
            description:
              'last-day、last-week、last-month、last-year、YYYY-MM-DD または YYYY-MM-DD:YYYY-MM-DD を指定します。',
          },
          ko: {
            description:
              'last-day, last-week, last-month, last-year, YYYY-MM-DD 또는 YYYY-MM-DD:YYYY-MM-DD를 지원합니다.',
          },
        },
        schema: { type: 'string' },
        example: 'last-month',
      },
      {
        name: 'package',
        in: 'path',
        required: true,
        description:
          'A package name, such as nuxt or @nuxt/kit, or comma-separated unscoped names such as nuxt,vue.',
        'x-i18n': {
          'zh-CN': {
            description: '包名，例如 nuxt、@nuxt/kit，或用逗号分隔的普通包名，例如 nuxt,vue。',
          },
          'zh-TW': {
            description:
              '套件名稱，例如 nuxt、@nuxt/kit，或用逗號分隔的一般套件名稱，例如 nuxt,vue。',
          },
          ja: {
            description:
              'nuxt、@nuxt/kit などの名前、または nuxt,vue のようなカンマ区切りの通常の名前。',
          },
          ko: {
            description: 'nuxt, @nuxt/kit 등의 이름 또는 nuxt,vue처럼 쉼표로 구분한 일반 이름.',
          },
        },
        schema: { type: 'string' },
        example: 'nuxt',
      },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'The original download count object or bulk result keyed by package name.',
        'x-i18n': {
          'zh-CN': { description: '原始下载统计对象，或以包名为键的批量统计结果。' },
          'zh-TW': { description: '原始下載統計物件，或以套件名稱為索引鍵的批次統計結果。' },
          ja: { description: '元のダウンロード統計オブジェクト、または名前をキーにした一括結果。' },
          ko: { description: '원본 다운로드 통계 객체 또는 패키지 이름을 키로 하는 일괄 결과.' },
        },
        content: {
          'application/json': {
            schema: {
              oneOf: [
                { $ref: '#/components/schemas/NpmjsDownloadCount' },
                {
                  type: 'object',
                  additionalProperties: {
                    anyOf: [{ $ref: '#/components/schemas/NpmjsDownloadCount' }, { type: 'null' }],
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
        responses: {
          NpmjsNotModified: {
            description: 'Not modified.',
            'x-i18n': {
              'zh-CN': { description: '内容未修改。' },
              'zh-TW': { description: '內容未修改。' },
              ja: { description: '変更されていません。' },
              ko: { description: '변경되지 않았습니다.' },
            },
          },
          NpmjsError: {
            description: 'The original npmjs error or an AnyMeta proxy error.',
            'x-i18n': {
              'zh-CN': { description: 'npmjs 原始错误或 AnyMeta 代理错误。' },
              'zh-TW': { description: 'npmjs 原始錯誤或 AnyMeta 代理錯誤。' },
              ja: { description: 'npmjs の元のエラーまたは AnyMeta のプロキシエラー。' },
              ko: { description: 'npmjs 원본 오류 또는 AnyMeta 프록시 오류.' },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    error: { type: 'string' },
                    message: { type: 'string' },
                    statusCode: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
        schemas: {
          NpmjsDownloadCount: {
            type: 'object',
            additionalProperties: true,
            required: ['downloads', 'start', 'end', 'package'],
            properties: {
              downloads: { type: 'integer', minimum: 0 },
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
  return proxyNpmjsRequest(event, getNpmjsDownloadsPointPath(event))
})
