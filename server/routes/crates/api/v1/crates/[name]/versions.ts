import { defineEventHandler } from 'h3'
import { getCratesPackagePath, proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Packages'],
    summary: 'List crate versions',
    description:
      'Lists crate versions. Setting per_page enables cursor pagination through meta.next_page.',
    'x-docs': {
      platform: 'crates',
      category: 'packages',
      endpoint: 'versions',
      order: 220,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 依赖包'],
        summary: '列出依赖包版本',
        description: '列出依赖包版本，指定 per_page 后通过 meta.next_page 进行游标分页。',
      },
      'zh-TW': {
        tags: ['crates.io 套件'],
        summary: '列出套件版本',
        description: '列出套件版本，指定 per_page 後透過 meta.next_page 進行游標分頁。',
      },
      ja: {
        tags: ['crates.io パッケージ'],
        summary: 'パッケージのバージョン一覧を取得',
        description: 'パッケージのバージョンを返します。per_page を指定すると meta.next_page でページ分割できます。',
      },
      ko: {
        tags: ['crates.io 패키지'],
        summary: '패키지 버전 목록 조회',
        description: '패키지 버전을 반환합니다. per_page를 지정하면 meta.next_page로 커서 페이지를 이동합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/rust-lang/crates.io/blob/main/src/controllers/krate/versions.rs',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/CratesName' },
      {
        name: 'sort',
        in: 'query',
        description: 'Version ordering.',
        'x-i18n': {
          'zh-CN': { description: '版本排序方式。' },
          'zh-TW': { description: '版本排序方式。' },
          ja: { description: 'バージョンの並び順。' },
          ko: { description: '버전 정렬 방식.' },
        },
        schema: { type: 'string', enum: ['date', 'semver'], default: 'semver' },
      },
      {
        name: 'include',
        in: 'query',
        description: 'Include release track details.',
        'x-i18n': {
          'zh-CN': { description: '包含发行轨道详情。' },
          'zh-TW': { description: '包含發行軌道詳情。' },
          ja: { description: 'リリーストラックの詳細を含めます。' },
          ko: { description: '릴리스 트랙 세부 정보를 포함합니다.' },
        },
        schema: { type: 'string', enum: ['release_tracks'] },
      },
      {
        name: 'per_page',
        in: 'query',
        description: 'Enable cursor pagination with this page size. Omit to return all versions.',
        'x-i18n': {
          'zh-CN': { description: '指定每页数量以启用游标分页，省略时返回所有版本。' },
          'zh-TW': { description: '指定每頁數量以啟用游標分頁，省略時傳回所有版本。' },
          ja: { description: '件数を指定してカーソルページ分割を有効にします。省略時は全バージョン。' },
          ko: { description: '페이지 크기를 지정하면 커서 페이지 나누기를 사용합니다. 생략하면 모든 버전을 반환합니다.' },
        },
        schema: { type: 'integer', minimum: 1, maximum: 100 },
      },
      { $ref: '#/components/parameters/CratesSeek' },
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
    path: getCratesPackagePath(event, 'versions'),
  })
})
