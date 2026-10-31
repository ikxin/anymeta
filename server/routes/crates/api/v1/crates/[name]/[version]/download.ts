import { defineEventHandler } from 'h3'
import { getCratesVersionPath, proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Packages'],
    summary: 'Get a crate version download URL',
    description: 'Returns the original JSON URL for the crate archive.',
    'x-docs': {
      platform: 'crates',
      category: 'packages',
      endpoint: 'download-url',
      order: 280,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 依赖包'],
        summary: '获取依赖包版本下载地址',
        description: '返回依赖包归档文件的原始 JSON 下载地址对象。',
      },
      'zh-TW': {
        tags: ['crates.io 套件'],
        summary: '取得套件版本下載網址',
        description: '傳回套件封存檔的原始 JSON 下載網址物件。',
      },
      ja: {
        tags: ['crates.io パッケージ'],
        summary: 'バージョンのダウンロード URL を取得',
        description: 'パッケージアーカイブの元の JSON ダウンロード URL オブジェクトを返します。',
      },
      ko: {
        tags: ['crates.io 패키지'],
        summary: '패키지 버전 다운로드 URL 조회',
        description: '패키지 아카이브의 원본 JSON 다운로드 URL 객체를 반환합니다.',
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
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              required: ['url'],
              properties: { url: { type: 'string', format: 'uri' } },
            },
          },
        },
      },
      304: { $ref: '#/components/responses/CratesNotModified' },
      default: { $ref: '#/components/responses/CratesError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyCratesRequest(event, {
    path: getCratesVersionPath(event, 'download'),
    contentType: 'application/json',
  })
})
