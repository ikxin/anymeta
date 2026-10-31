import { defineEventHandler } from 'h3'
import { getCratesPackagePath, proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Packages'],
    summary: 'List reverse dependencies',
    description:
      'Lists crates depending on this crate, their version metadata, and the total count.',
    'x-docs': {
      platform: 'crates',
      category: 'packages',
      endpoint: 'reverse-dependencies',
      order: 250,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 依赖包'],
        summary: '列出反向依赖',
        description: '列出依赖此依赖包的其他依赖包、对应版本元数据及总数。',
      },
      'zh-TW': {
        tags: ['crates.io 套件'],
        summary: '列出反向相依性',
        description: '列出相依於此套件的其他套件、對應版本中繼資料及總數。',
      },
      ja: {
        tags: ['crates.io パッケージ'],
        summary: '逆依存関係を取得',
        description: 'このパッケージに依存するパッケージ、バージョンのメタデータ、総数を返します。',
      },
      ko: {
        tags: ['crates.io 패키지'],
        summary: '역방향 의존성 목록 조회',
        description: '이 패키지에 의존하는 패키지, 버전 메타데이터 및 총수를 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/rust-lang/crates.io/blob/main/src/controllers/krate/rev_deps.rs',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/CratesName' },
      { $ref: '#/components/parameters/CratesPerPage' },
      { $ref: '#/components/parameters/CratesPage' },
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
                versions: { type: 'array', items: { $ref: '#/components/schemas/CratesVersion' } },
                meta: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    total: { type: 'integer', minimum: 0 },
                    next_page: { type: ['string', 'null'] },
                    prev_page: { type: ['string', 'null'] },
                  },
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
    path: getCratesPackagePath(event, 'reverse_dependencies'),
  })
})
