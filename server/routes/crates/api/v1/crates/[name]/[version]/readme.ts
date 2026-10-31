import { defineEventHandler } from 'h3'
import { getCratesVersionPath, proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Packages'],
    summary: 'Get a crate version README URL',
    description:
      'Returns the original JSON URL pointing to the rendered README for a crate version.',
    'x-docs': {
      platform: 'crates',
      category: 'packages',
      endpoint: 'readme',
      order: 270,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 依赖包'],
        summary: '获取依赖包版本 README 地址',
        description: '返回指向依赖包指定版本渲染后 README 的原始 JSON 地址对象。',
      },
      'zh-TW': {
        tags: ['crates.io 套件'],
        summary: '取得套件版本 README 網址',
        description: '傳回指向套件指定版本轉譯後 README 的原始 JSON 網址物件。',
      },
      ja: {
        tags: ['crates.io パッケージ'],
        summary: 'バージョンの README URL を取得',
        description: '指定バージョンのレンダリング済み README を指す元の JSON URL オブジェクトを返します。',
      },
      ko: {
        tags: ['crates.io 패키지'],
        summary: '패키지 버전 README URL 조회',
        description: '지정한 패키지 버전의 렌더링된 README를 가리키는 원본 JSON URL 객체를 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/rust-lang/crates.io/blob/main/src/controllers/version/readme.rs',
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
    path: getCratesVersionPath(event, 'readme'),
    contentType: 'application/json',
  })
})
