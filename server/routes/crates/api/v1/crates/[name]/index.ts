import { defineEventHandler } from 'h3'
import { getCratesPackagePath, proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Packages'],
    summary: 'Get crate metadata',
    description:
      'Returns original crate metadata, versions, keywords, and categories from crates.io.',
    'x-docs': {
      platform: 'crates',
      category: 'packages',
      endpoint: 'get',
      order: 210,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 依赖包'],
        summary: '获取依赖包元数据',
        description: '返回 crates.io 原始依赖包元数据、版本、关键词和分类。',
      },
      'zh-TW': {
        tags: ['crates.io 套件'],
        summary: '取得套件中繼資料',
        description: '傳回 crates.io 原始套件中繼資料、版本、關鍵字和分類。',
      },
      ja: {
        tags: ['crates.io パッケージ'],
        summary: 'パッケージのメタデータを取得',
        description: 'crates.io の元のパッケージメタデータ、バージョン、キーワード、カテゴリを返します。',
      },
      ko: {
        tags: ['crates.io 패키지'],
        summary: '패키지 메타데이터 조회',
        description: 'crates.io 원본 패키지 메타데이터, 버전, 키워드 및 분류를 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/rust-lang/crates.io/blob/main/src/controllers/krate/metadata.rs',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/CratesName' },
      {
        name: 'include',
        in: 'query',
        description:
          'Comma-separated versions, keywords, categories, badges, downloads, default_version, or full.',
        'x-i18n': {
          'zh-CN': {
            description:
              '用逗号分隔的 versions、keywords、categories、badges、downloads、default_version 或 full。',
          },
          'zh-TW': {
            description:
              '以逗號分隔的 versions、keywords、categories、badges、downloads、default_version 或 full。',
          },
          ja: {
            description:
              'versions、keywords、categories、badges、downloads、default_version、full をカンマで区切ります。',
          },
          ko: {
            description:
              '쉼표로 구분한 versions, keywords, categories, badges, downloads, default_version 또는 full.',
          },
        },
        schema: { type: 'string', default: 'full' },
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
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              required: ['crate'],
              properties: {
                crate: { $ref: '#/components/schemas/CratesPackage' },
                versions: {
                  anyOf: [
                    { type: 'array', items: { $ref: '#/components/schemas/CratesVersion' } },
                    { type: 'null' },
                  ],
                },
                keywords: {
                  anyOf: [
                    { type: 'array', items: { $ref: '#/components/schemas/CratesKeyword' } },
                    { type: 'null' },
                  ],
                },
                categories: {
                  anyOf: [
                    { type: 'array', items: { $ref: '#/components/schemas/CratesCategory' } },
                    { type: 'null' },
                  ],
                },
              },
            },
          },
        },
      },
      304: { $ref: '#/components/responses/CratesNotModified' },
      default: { $ref: '#/components/responses/CratesError' },
    },
    $global: {
      components: {
        parameters: {
          CratesName: {
            name: 'name',
            in: 'path',
            required: true,
            description: 'The crate name.',
            'x-i18n': {
              'zh-CN': { description: '依赖包名称。' },
              'zh-TW': { description: '套件名稱。' },
              ja: { description: 'パッケージ名。' },
              ko: { description: '패키지 이름.' },
            },
            schema: { type: 'string' },
            example: 'serde',
          },
          CratesVersion: {
            name: 'version',
            in: 'path',
            required: true,
            description: 'An exact crate version.',
            'x-i18n': {
              'zh-CN': { description: '依赖包的精确版本号。' },
              'zh-TW': { description: '套件的精確版本號。' },
              ja: { description: 'パッケージの正確なバージョン。' },
              ko: { description: '패키지의 정확한 버전.' },
            },
            schema: { type: 'string' },
            example: '1.0.228',
          },
          CratesPage: {
            name: 'page',
            in: 'query',
            description: 'The page number, mutually exclusive with seek.',
            'x-i18n': {
              'zh-CN': { description: '页码，不能与 seek 同时使用。' },
              'zh-TW': { description: '頁碼，不可與 seek 同時使用。' },
              ja: { description: 'ページ番号。seek とは併用できません。' },
              ko: { description: '페이지 번호. seek와 함께 사용할 수 없습니다.' },
            },
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          CratesPerPage: {
            name: 'per_page',
            in: 'query',
            description: 'Results per page, up to 100.',
            'x-i18n': {
              'zh-CN': { description: '每页结果数量，最多 100 条。' },
              'zh-TW': { description: '每頁結果數量，最多 100 筆。' },
              ja: { description: '1 ページの件数。最大 100 件。' },
              ko: { description: '페이지당 결과 수. 최대 100개.' },
            },
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
          CratesSeek: {
            name: 'seek',
            in: 'query',
            description: 'An opaque cursor from meta.next_page. Do not combine with page.',
            'x-i18n': {
              'zh-CN': { description: 'meta.next_page 中的不透明游标，不能与 page 同时使用。' },
              'zh-TW': { description: 'meta.next_page 中的不透明游標，不可與 page 同時使用。' },
              ja: { description: 'meta.next_page の不透明カーソル。page とは併用できません。' },
              ko: { description: 'meta.next_page의 불투명 커서. page와 함께 사용할 수 없습니다.' },
            },
            schema: { type: 'string' },
          },
        },
        schemas: {
          CratesPackage: {
            type: 'object',
            additionalProperties: true,
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: ['string', 'null'] },
              downloads: { type: 'integer', minimum: 0 },
              recent_downloads: { anyOf: [{ type: 'integer', minimum: 0 }, { type: 'null' }] },
              num_versions: { type: 'integer', minimum: 0 },
              max_version: { type: 'string' },
              newest_version: { type: 'string' },
              max_stable_version: { type: ['string', 'null'] },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              homepage: { anyOf: [{ type: 'string', format: 'uri' }, { type: 'null' }] },
              documentation: { anyOf: [{ type: 'string', format: 'uri' }, { type: 'null' }] },
              repository: { anyOf: [{ type: 'string', format: 'uri' }, { type: 'null' }] },
              versions: { type: 'array', items: { type: 'integer' } },
            },
          },
          CratesVersion: {
            type: 'object',
            additionalProperties: true,
            properties: {
              id: { type: 'integer' },
              crate: { type: 'string' },
              num: { type: 'string' },
              downloads: { type: 'integer', minimum: 0 },
              yanked: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              license: { type: ['string', 'null'] },
              rust_version: { type: ['string', 'null'] },
              crate_size: { anyOf: [{ type: 'integer', minimum: 0 }, { type: 'null' }] },
              checksum: { type: 'string' },
              dl_path: { type: 'string' },
              readme_path: { type: 'string' },
              features: {
                type: 'object',
                additionalProperties: { type: 'array', items: { type: 'string' } },
              },
              published_by: {
                anyOf: [
                  {
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                      id: { type: 'integer' },
                      login: { type: 'string' },
                      name: { type: ['string', 'null'] },
                      avatar: { anyOf: [{ type: 'string', format: 'uri' }, { type: 'null' }] },
                      url: { type: 'string', format: 'uri' },
                      kind: { type: 'string' },
                    },
                  },
                  { type: 'null' },
                ],
              },
            },
          },
          CratesDependency: {
            type: 'object',
            additionalProperties: true,
            properties: {
              id: { type: 'integer' },
              version_id: { type: 'integer' },
              crate_id: { type: 'string' },
              req: { type: 'string' },
              optional: { type: 'boolean' },
              default_features: { type: 'boolean' },
              features: { type: 'array', items: { type: 'string' } },
              target: { type: ['string', 'null'] },
              kind: { type: 'string' },
              downloads: { type: 'integer', minimum: 0 },
            },
          },
          CratesDownloads: {
            type: 'object',
            additionalProperties: true,
            properties: {
              version_downloads: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    date: { type: 'string', format: 'date' },
                    downloads: { type: 'integer', minimum: 0 },
                    version: { type: 'integer' },
                  },
                },
              },
              versions: { type: 'array', items: { $ref: '#/components/schemas/CratesVersion' } },
              meta: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  extra_downloads: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: true,
                      properties: {
                        date: { type: 'string', format: 'date' },
                        downloads: { type: 'integer', minimum: 0 },
                      },
                    },
                  },
                },
              },
            },
          },
          CratesCategory: {
            type: 'object',
            additionalProperties: true,
            properties: {
              id: { type: 'string' },
              category: { type: 'string' },
              slug: { type: 'string' },
              description: { type: 'string' },
              crates_cnt: { type: 'integer', minimum: 0 },
              created_at: { type: 'string', format: 'date-time' },
              subcategories: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    id: { type: 'string' },
                    category: { type: 'string' },
                    slug: { type: 'string' },
                    description: { type: 'string' },
                    crates_cnt: { type: 'integer', minimum: 0 },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
              parent_categories: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    id: { type: 'string' },
                    category: { type: 'string' },
                    slug: { type: 'string' },
                    description: { type: 'string' },
                    crates_cnt: { type: 'integer', minimum: 0 },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          CratesKeyword: {
            type: 'object',
            additionalProperties: true,
            properties: {
              id: { type: 'string' },
              keyword: { type: 'string' },
              crates_cnt: { type: 'integer', minimum: 0 },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        },
        responses: {
          CratesNotModified: {
            description: 'Not modified.',
            'x-i18n': {
              'zh-CN': { description: '内容未修改。' },
              'zh-TW': { description: '內容未修改。' },
              ja: { description: '変更されていません。' },
              ko: { description: '변경되지 않았습니다.' },
            },
          },
          CratesError: {
            description: 'The original upstream error or an AnyMeta proxy error.',
            'x-i18n': {
              'zh-CN': { description: 'crates.io 原始错误或 AnyMeta 代理错误。' },
              'zh-TW': { description: 'crates.io 原始錯誤或 AnyMeta 代理錯誤。' },
              ja: { description: 'crates.io の元のエラーまたは AnyMeta のプロキシエラー。' },
              ko: { description: 'crates.io 원본 오류 또는 AnyMeta 프록시 오류.' },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    message: { type: 'string' },
                    statusCode: { type: 'integer' },
                    errors: {
                      type: 'array',
                      items: {
                        type: 'object',
                        additionalProperties: true,
                        properties: { detail: { type: 'string' } },
                      },
                    },
                  },
                },
              },
              'text/plain': { schema: { type: 'string' } },
              'text/html': { schema: { type: 'string' } },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyCratesRequest(event, {
    path: getCratesPackagePath(event),
  })
})
