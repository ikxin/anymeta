import { defineEventHandler } from 'h3'
import { getPypiProjectPath, proxyPypiRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['PyPI Packages'],
    summary: 'Get project file index',
    description:
      'Returns the JSON Simple API index of versions, file URLs, hashes, Python requirements, and yanked status.',
    'x-docs': {
      platform: 'pypi',
      category: 'packages',
      endpoint: 'files',
      order: 390,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['PyPI 依赖包'],
        summary: '获取依赖包文件索引',
        description: '返回 JSON Simple API 索引，包括版本、文件地址、哈希、Python 版本要求和撤回状态。',
      },
      'zh-TW': {
        tags: ['PyPI 套件'],
        summary: '取得套件檔案索引',
        description: '傳回 JSON Simple API 索引，包括版本、檔案網址、雜湊、Python 版本要求和撤回狀態。',
      },
      ja: {
        tags: ['PyPI パッケージ'],
        summary: 'パッケージのファイルインデックスを取得',
        description: 'バージョン、ファイル URL、ハッシュ、Python 要件、取り下げ状態を含む JSON Simple API インデックスを返します。',
      },
      ko: {
        tags: ['PyPI 패키지'],
        summary: '패키지 파일 인덱스 조회',
        description: '버전, 파일 URL, 해시, Python 요구 사항 및 철회 상태가 포함된 JSON Simple API 인덱스를 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.pypi.org/api/index-api/#get-distributions-for-project' },
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
          'application/vnd.pypi.simple.v1+json': {
            schema: { $ref: '#/components/schemas/PypiProjectIndex' },
          },
        },
      },
      304: { $ref: '#/components/responses/PypiNotModified' },
      default: { $ref: '#/components/responses/PypiError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyPypiRequest(event, {
    path: getPypiProjectPath(event, 'index'),
    accept: 'application/vnd.pypi.simple.v1+json',
  })
})
