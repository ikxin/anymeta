import { defineEventHandler } from 'h3'
import { getPypiProjectPath, proxyPypiRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['PyPI Packages'],
    summary: 'Get project metadata',
    description:
      'Returns latest release metadata, distribution files, and known vulnerabilities. Use the index API for version enumeration.',
    'x-docs': {
      platform: 'pypi',
      category: 'packages',
      endpoint: 'get',
      order: 370,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['PyPI 依赖包'],
        summary: '获取依赖包元数据',
        description: '返回最新发行版本元数据、分发文件和已知漏洞，版本枚举建议使用索引接口。',
      },
      'zh-TW': {
        tags: ['PyPI 套件'],
        summary: '取得套件中繼資料',
        description: '傳回最新發行版本中繼資料、散布檔案和已知弱點，版本列舉建議使用索引介面。',
      },
      ja: {
        tags: ['PyPI パッケージ'],
        summary: 'パッケージのメタデータを取得',
        description: '最新リリースのメタデータ、配布ファイル、既知の脆弱性を返します。バージョン一覧にはインデックス API を利用してください。',
      },
      ko: {
        tags: ['PyPI 패키지'],
        summary: '패키지 메타데이터 조회',
        description: '최신 릴리스 메타데이터, 배포 파일 및 알려진 취약점을 반환합니다. 버전 열거에는 인덱스 API를 사용하세요.',
      },
    },
    externalDocs: { url: 'https://docs.pypi.org/api/json/#get-a-project' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/PypiProject' },
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
              allOf: [
                { $ref: '#/components/schemas/PypiRelease' },
                {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    releases: {
                      type: 'object',
                      additionalProperties: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/PypiFile' },
                      },
                      deprecated: true,
                    },
                  },
                },
              ],
            },
          },
        },
      },
      304: { $ref: '#/components/responses/PypiNotModified' },
      default: { $ref: '#/components/responses/PypiError' },
    },
    $global: {
      components: {
        parameters: {
          PypiProject: {
            name: 'project',
            in: 'path',
            required: true,
            description:
              'The project name. Case and runs of hyphens, underscores, and dots are normalized.',
            'x-i18n': {
              'zh-CN': { description: '依赖包名称，会统一大小写，并将连续的连字符、下划线和点规范化为连字符。' },
              'zh-TW': { description: '套件名稱，會統一大小寫，並將連續的連字號、底線和點正規化為連字號。' },
              ja: { description: 'パッケージ名。大文字小文字と連続するハイフン、アンダースコア、ピリオドを正規化します。' },
              ko: { description: '패키지 이름. 대소문자와 연속된 하이픈, 밑줄 및 점을 정규화합니다.' },
            },
            schema: { type: 'string' },
            example: 'sampleproject',
          },
          PypiVersion: {
            name: 'version',
            in: 'path',
            required: true,
            description: 'An exact project release version.',
            'x-i18n': {
              'zh-CN': { description: '依赖包的精确发行版本号。' },
              'zh-TW': { description: '套件的精確發行版本號。' },
              ja: { description: 'パッケージの正確なリリースバージョン。' },
              ko: { description: '패키지의 정확한 릴리스 버전.' },
            },
            schema: { type: 'string' },
            example: '4.0.0',
          },
          PypiFilename: {
            name: 'filename',
            in: 'path',
            required: true,
            description: 'The distribution filename returned by the project or index API.',
            'x-i18n': {
              'zh-CN': { description: '项目或索引接口返回的分发文件名称。' },
              'zh-TW': { description: '專案或索引介面傳回的散布檔案名稱。' },
              ja: { description: 'プロジェクトまたはインデックス API が返した配布ファイル名。' },
              ko: { description: '프로젝트 또는 인덱스 API가 반환한 배포 파일 이름.' },
            },
            schema: { type: 'string' },
            example: 'sampleproject-4.0.0.tar.gz',
          },
        },
        schemas: {
          PypiInfo: {
            type: 'object',
            additionalProperties: true,
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              summary: { type: ['string', 'null'] },
              description: { type: 'string' },
              description_content_type: { type: ['string', 'null'] },
              author: { type: ['string', 'null'] },
              author_email: { type: ['string', 'null'] },
              maintainer: { type: ['string', 'null'] },
              maintainer_email: { type: ['string', 'null'] },
              license: { type: ['string', 'null'] },
              license_expression: { type: ['string', 'null'] },
              license_files: {
                anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }],
              },
              home_page: { type: ['string', 'null'] },
              project_urls: {
                anyOf: [
                  { type: 'object', additionalProperties: { type: 'string' } },
                  { type: 'null' },
                ],
              },
              requires_python: { type: ['string', 'null'] },
              requires_dist: {
                anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }],
              },
              classifiers: { type: 'array', items: { type: 'string' } },
              keywords: { type: ['string', 'null'] },
              provides_extra: { type: 'array', items: { type: 'string' } },
            },
          },
          PypiFile: {
            type: 'object',
            additionalProperties: true,
            properties: {
              filename: { type: 'string' },
              url: { type: 'string', format: 'uri' },
              size: { type: 'integer', minimum: 0 },
              packagetype: { type: 'string' },
              python_version: { type: 'string' },
              requires_python: { type: ['string', 'null'] },
              digests: { type: 'object', additionalProperties: { type: 'string' } },
              upload_time_iso_8601: { type: 'string', format: 'date-time' },
              yanked: { type: 'boolean' },
              yanked_reason: { type: ['string', 'null'] },
              'core-metadata': {
                anyOf: [
                  { type: 'boolean' },
                  { type: 'object', additionalProperties: { type: 'string' } },
                ],
              },
            },
          },
          PypiRelease: {
            type: 'object',
            additionalProperties: true,
            required: ['info', 'urls', 'last_serial'],
            properties: {
              info: { $ref: '#/components/schemas/PypiInfo' },
              last_serial: { type: 'integer' },
              urls: { type: 'array', items: { $ref: '#/components/schemas/PypiFile' } },
              vulnerabilities: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    id: { type: 'string' },
                    aliases: { type: 'array', items: { type: 'string' } },
                    details: { type: 'string' },
                    summary: { type: ['string', 'null'] },
                    fixed_in: { type: 'array', items: { type: 'string' } },
                    link: { type: 'string', format: 'uri' },
                    source: { type: 'string' },
                    withdrawn: { type: ['string', 'null'], format: 'date-time' },
                  },
                },
              },
            },
          },
          PypiProjectIndex: {
            type: 'object',
            additionalProperties: true,
            required: ['meta', 'name', 'files'],
            properties: {
              meta: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  'api-version': { type: 'string' },
                  '_last-serial': { type: 'integer' },
                },
              },
              name: { type: 'string' },
              versions: { type: 'array', items: { type: 'string' } },
              files: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    filename: { type: 'string' },
                    url: { type: 'string', format: 'uri' },
                    hashes: { type: 'object', additionalProperties: { type: 'string' } },
                    size: { type: 'integer', minimum: 0 },
                    'requires-python': { type: ['string', 'null'] },
                    yanked: { type: ['boolean', 'string'] },
                    'core-metadata': {
                      anyOf: [
                        { type: 'boolean' },
                        { type: 'object', additionalProperties: { type: 'string' } },
                      ],
                    },
                    provenance: { anyOf: [{ type: 'string', format: 'uri' }, { type: 'null' }] },
                  },
                },
              },
            },
          },
        },
        responses: {
          PypiNotModified: {
            description: 'Not modified.',
            'x-i18n': {
              'zh-CN': { description: '内容未修改。' },
              'zh-TW': { description: '內容未修改。' },
              ja: { description: '変更されていません。' },
              ko: { description: '변경되지 않았습니다.' },
            },
          },
          PypiError: {
            description: 'The original upstream error or an AnyMeta proxy error.',
            'x-i18n': {
              'zh-CN': { description: 'PyPI 原始错误或 AnyMeta 代理错误。' },
              'zh-TW': { description: 'PyPI 原始錯誤或 AnyMeta 代理錯誤。' },
              ja: { description: 'PyPI の元のエラーまたは AnyMeta のプロキシエラー。' },
              ko: { description: 'PyPI 원본 오류 또는 AnyMeta 프록시 오류.' },
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
  return proxyPypiRequest(event, {
    path: getPypiProjectPath(event, 'project'),
  })
})
