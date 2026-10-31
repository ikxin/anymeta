import { defineEventHandler } from 'h3'
import { getNpmjsPackagePath, proxyNpmjsRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['npmjs Packages'],
    summary: 'Get package distribution tags',
    description: 'Returns the original mapping of npm distribution tags to version numbers.',
    'x-docs': {
      platform: 'npmjs',
      category: 'packages',
      endpoint: 'dist-tags',
      order: 110,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['npmjs 依赖包'],
        summary: '获取依赖包发布标签',
        description: '返回 npm 原始发布标签与版本号的对应关系。',
      },
      'zh-TW': {
        tags: ['npmjs 套件'],
        summary: '取得套件發佈標籤',
        description: '傳回 npm 原始發佈標籤與版本號的對應關係。',
      },
      ja: {
        tags: ['npmjs パッケージ'],
        summary: 'パッケージの配布タグを取得',
        description: 'npm の配布タグとバージョン番号の元の対応表を返します。',
      },
      ko: {
        tags: ['npmjs 패키지'],
        summary: '패키지 배포 태그 조회',
        description: 'npm 배포 태그와 버전 번호의 원본 매핑을 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.npmjs.com/cli/commands/npm-dist-tag' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/NpmjsPackage' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'Distribution tags keyed by tag name.',
        'x-i18n': {
          'zh-CN': { description: '以标签名为键的发布标签。' },
          'zh-TW': { description: '以標籤名稱為索引鍵的發佈標籤。' },
          ja: { description: 'タグ名をキーとする配布タグ。' },
          ko: { description: '태그 이름을 키로 하는 배포 태그.' },
        },
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/NpmjsDistTags' } },
        },
      },
      304: { $ref: '#/components/responses/NpmjsNotModified' },
      default: { $ref: '#/components/responses/NpmjsError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyNpmjsRequest(event, `-/package/${getNpmjsPackagePath(event)}/dist-tags`, 'registry')
})
