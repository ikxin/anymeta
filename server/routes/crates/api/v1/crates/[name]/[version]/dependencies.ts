import { defineEventHandler } from 'h3'
import { getCratesVersionPath, proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Packages'],
    summary: 'Get crate version dependencies',
    description:
      'Returns dependencies and version requirements, with optional, target, feature, and dependency-kind metadata.',
    'x-docs': {
      platform: 'crates',
      category: 'packages',
      endpoint: 'dependencies',
      order: 240,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 依赖包'],
        summary: '获取依赖包版本依赖',
        description: '返回依赖项及版本要求，包括可选状态、目标平台、特性和依赖类型。',
      },
      'zh-TW': {
        tags: ['crates.io 套件'],
        summary: '取得套件版本相依性',
        description: '傳回相依項及版本要求，包括可選狀態、目標平台、功能和相依類型。',
      },
      ja: {
        tags: ['crates.io パッケージ'],
        summary: 'バージョンの依存関係を取得',
        description: '依存関係とバージョン要件、オプション状態、対象、機能、依存種別を返します。',
      },
      ko: {
        tags: ['crates.io 패키지'],
        summary: '패키지 버전 의존성 조회',
        description: '의존성과 버전 요구 사항, 선택 여부, 대상, 기능 및 의존성 유형을 반환합니다.',
      },
    },
    externalDocs: {
      url:
        'https://github.com/rust-lang/crates.io/blob/main/src/controllers/version/dependencies.rs',
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
              properties: {
                dependencies: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CratesDependency' },
                },
              },
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
    path: getCratesVersionPath(event, 'dependencies'),
  })
})
