import { defineEventHandler } from 'h3'
import { getNpmjsPackagePath, proxyNpmjsRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['npmjs Packages'],
    summary: 'Get package metadata',
    description:
      'Returns the original public npm package metadata, including versions, distribution tags, publication times, and README. Scoped package names must be URL encoded as a single path segment.',
    'x-docs': {
      platform: 'npmjs',
      category: 'packages',
      endpoint: 'get',
      order: 130,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['npmjs 依赖包'],
        summary: '获取依赖包元数据',
        description:
          '返回公开 npm 依赖包的原始元数据，包括版本、发布标签、发布时间和 README。作用域依赖包名称必须编码为单个路径段。',
      },
      'zh-TW': {
        tags: ['npmjs 套件'],
        summary: '取得套件中繼資料',
        description:
          '傳回公開 npm 套件的原始中繼資料，包括版本、發佈標籤、發佈時間和 README。範圍套件名稱必須編碼為單一路徑區段。',
      },
      ja: {
        tags: ['npmjs パッケージ'],
        summary: 'パッケージのメタデータを取得',
        description:
          'バージョン、配布タグ、公開日時、README を含む公開 npm パッケージの元のメタデータを返します。スコープ付きの名前は単一のパス要素にエンコードしてください。',
      },
      ko: {
        tags: ['npmjs 패키지'],
        summary: '패키지 메타데이터 조회',
        description:
          '버전, 배포 태그, 게시 시간, README를 포함한 공개 npm 패키지의 원본 메타데이터를 반환합니다. 범위 패키지 이름은 단일 경로 세그먼트로 인코딩해야 합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/NpmjsPackage' },
      {
        name: 'Accept',
        in: 'header',
        description: 'Choose full metadata or abbreviated metadata for installation.',
        'x-i18n': {
          'zh-CN': { description: '选择完整元数据或用于安装的精简元数据。' },
          'zh-TW': { description: '選擇完整中繼資料或用於安裝的精簡中繼資料。' },
          ja: { description: '完全なメタデータ、またはインストール用の簡略形式を選択します。' },
          ko: { description: '전체 메타데이터 또는 설치용 축약 메타데이터를 선택합니다.' },
        },
        schema: {
          type: 'string',
          enum: ['application/json', 'application/vnd.npm.install-v1+json'],
          default: 'application/json',
        },
      },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'The original package metadata document.',
        'x-i18n': {
          'zh-CN': { description: '原始依赖包元数据文档。' },
          'zh-TW': { description: '原始套件中繼資料文件。' },
          ja: { description: '元のパッケージメタデータ。' },
          ko: { description: '원본 패키지 메타데이터 문서.' },
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              required: ['name', 'dist-tags', 'versions'],
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                'dist-tags': { $ref: '#/components/schemas/NpmjsDistTags' },
                versions: {
                  type: 'object',
                  additionalProperties: { $ref: '#/components/schemas/NpmjsPackageVersion' },
                },
                time: {
                  type: 'object',
                  additionalProperties: { type: 'string', format: 'date-time' },
                },
                modified: { type: 'string', format: 'date-time' },
                readme: { type: 'string' },
                homepage: { type: 'string' },
                license: { type: 'string' },
                keywords: { type: 'array', items: { type: 'string' } },
                maintainers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: true,
                    properties: { name: { type: 'string' }, email: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
      304: { $ref: '#/components/responses/NpmjsNotModified' },
      default: { $ref: '#/components/responses/NpmjsError' },
    },
    $global: {
      components: {
        parameters: {
          NpmjsPackage: {
            name: 'package',
            in: 'path',
            required: true,
            description:
              'A package name, such as nuxt or @nuxt/kit. Encode scoped names as one path segment, for example @nuxt%2Fkit.',
            'x-i18n': {
              'zh-CN': {
                description:
                  '依赖包名称，例如 nuxt 或 @nuxt/kit。作用域依赖包名称需编码为单个路径段，例如 @nuxt%2Fkit。',
              },
              'zh-TW': {
                description:
                  '套件名稱，例如 nuxt 或 @nuxt/kit。範圍套件名稱需編碼為單一路徑區段，例如 @nuxt%2Fkit。',
              },
              ja: {
                description:
                  'nuxt や @nuxt/kit などの名前。スコープ付きの名前は @nuxt%2Fkit のように単一のパス要素にエンコードします。',
              },
              ko: {
                description:
                  'nuxt 또는 @nuxt/kit 등의 이름. 범위 이름은 @nuxt%2Fkit처럼 단일 경로 세그먼트로 인코딩합니다.',
              },
            },
            schema: { type: 'string' },
            example: 'nuxt',
          },
        },
        schemas: {
          NpmjsDistTags: { type: 'object', additionalProperties: { type: 'string' } },
          NpmjsPackageVersion: {
            type: 'object',
            additionalProperties: true,
            required: ['name', 'version', 'dist'],
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              description: { type: 'string' },
              license: { type: 'string' },
              homepage: { type: 'string' },
              deprecated: { type: 'string' },
              dependencies: { type: 'object', additionalProperties: { type: 'string' } },
              devDependencies: { type: 'object', additionalProperties: { type: 'string' } },
              peerDependencies: { type: 'object', additionalProperties: { type: 'string' } },
              optionalDependencies: { type: 'object', additionalProperties: { type: 'string' } },
              engines: { type: 'object', additionalProperties: { type: 'string' } },
              dist: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  tarball: { type: 'string', format: 'uri' },
                  shasum: { type: 'string' },
                  integrity: { type: 'string' },
                  fileCount: { type: 'integer', minimum: 0 },
                  unpackedSize: { type: 'integer', minimum: 0 },
                },
              },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyNpmjsRequest(event, getNpmjsPackagePath(event), 'registry')
})
