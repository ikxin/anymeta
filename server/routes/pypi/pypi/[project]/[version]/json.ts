import { defineEventHandler } from 'h3'
import { getPypiProjectPath, proxyPypiRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['PyPI Packages'],
    summary: 'Get project release metadata',
    description:
      'Returns metadata, distribution files, and known vulnerabilities for one exact release.',
    'x-docs': {
      platform: 'pypi',
      category: 'packages',
      endpoint: 'version',
      order: 380,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['PyPI 依赖包'],
        summary: '获取依赖包版本信息',
        description: '返回依赖包指定发行版本的元数据、分发文件和已知漏洞。',
      },
      'zh-TW': {
        tags: ['PyPI 套件'],
        summary: '取得套件版本資訊',
        description: '傳回套件指定發行版本的中繼資料、散布檔案和已知弱點。',
      },
      ja: {
        tags: ['PyPI パッケージ'],
        summary: 'パッケージのリリース情報を取得',
        description: '指定したリリースのメタデータ、配布ファイル、既知の脆弱性を返します。',
      },
      ko: {
        tags: ['PyPI 패키지'],
        summary: '패키지 릴리스 정보 조회',
        description: '지정한 릴리스의 메타데이터, 배포 파일 및 알려진 취약점을 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.pypi.org/api/json/#get-a-release' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/PypiProject' },
      { $ref: '#/components/parameters/PypiVersion' },
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
        content: { 'application/json': { schema: { $ref: '#/components/schemas/PypiRelease' } } },
      },
      304: { $ref: '#/components/responses/PypiNotModified' },
      default: { $ref: '#/components/responses/PypiError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyPypiRequest(event, {
    path: getPypiProjectPath(event, 'release'),
  })
})
