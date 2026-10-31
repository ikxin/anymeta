import { defineEventHandler } from 'h3'
import { getCratesVersionPath, proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Packages'],
    summary: 'Get a crate version',
    description:
      'Returns metadata for an exact crate version, including features, license, and yanked status.',
    'x-docs': {
      platform: 'crates',
      category: 'packages',
      endpoint: 'version',
      order: 230,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 依赖包'],
        summary: '获取依赖包版本信息',
        description: '返回依赖包指定版本的元数据，包括特性、许可证和撤回状态。',
      },
      'zh-TW': {
        tags: ['crates.io 套件'],
        summary: '取得套件版本資訊',
        description: '傳回套件指定版本的中繼資料，包括功能、授權條款和撤回狀態。',
      },
      ja: {
        tags: ['crates.io パッケージ'],
        summary: 'パッケージのバージョン情報を取得',
        description: '指定バージョンの機能、ライセンス、取り下げ状態などのメタデータを返します。',
      },
      ko: {
        tags: ['crates.io 패키지'],
        summary: '패키지 버전 정보 조회',
        description: '지정한 패키지 버전의 기능, 라이선스 및 철회 상태 등 메타데이터를 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/rust-lang/crates.io/blob/main/src/controllers/version/metadata.rs',
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
              properties: { version: { $ref: '#/components/schemas/CratesVersion' } },
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
    path: getCratesVersionPath(event),
  })
})
