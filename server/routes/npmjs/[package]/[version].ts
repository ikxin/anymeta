import { defineEventHandler } from 'h3'
import { getNpmjsPackageVersionPath, proxyNpmjsRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['npmjs Packages'],
    summary: 'Get a package version',
    description: 'Returns the original npm package manifest for a version or distribution tag.',
    'x-docs': {
      platform: 'npmjs',
      category: 'packages',
      endpoint: 'version',
      order: 120,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['npmjs 依赖包'],
        summary: '获取依赖包版本信息',
        description: '返回指定版本或发布标签对应的 npm 原始依赖包清单。',
      },
      'zh-TW': {
        tags: ['npmjs 套件'],
        summary: '取得套件版本資訊',
        description: '傳回指定版本或發佈標籤對應的 npm 原始套件資訊。',
      },
      ja: {
        tags: ['npmjs パッケージ'],
        summary: 'パッケージのバージョン情報を取得',
        description: '指定したバージョンまたは配布タグの元の npm マニフェストを返します。',
      },
      ko: {
        tags: ['npmjs 패키지'],
        summary: '패키지 버전 정보 조회',
        description: '지정한 버전 또는 배포 태그에 해당하는 npm 원본 매니페스트를 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/NpmjsPackage' },
      {
        name: 'version',
        in: 'path',
        required: true,
        description: 'An exact version or distribution tag, such as 4.0.0, latest, or next.',
        'x-i18n': {
          'zh-CN': { description: '精确版本号或发布标签，例如 4.0.0、latest 或 next。' },
          'zh-TW': { description: '精確版本號或發佈標籤，例如 4.0.0、latest 或 next。' },
          ja: { description: '4.0.0、latest、next などの正確なバージョンまたは配布タグ。' },
          ko: { description: '4.0.0, latest, next 등의 정확한 버전 또는 배포 태그.' },
        },
        schema: { type: 'string' },
        example: 'latest',
      },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'The original package version manifest.',
        'x-i18n': {
          'zh-CN': { description: '原始依赖包版本清单。' },
          'zh-TW': { description: '原始套件版本資訊。' },
          ja: { description: '元のパッケージバージョンのマニフェスト。' },
          ko: { description: '원본 패키지 버전 매니페스트.' },
        },
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/NpmjsPackageVersion' } },
        },
      },
      304: { $ref: '#/components/responses/NpmjsNotModified' },
      default: { $ref: '#/components/responses/NpmjsError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyNpmjsRequest(event, getNpmjsPackageVersionPath(event), 'registry')
})
