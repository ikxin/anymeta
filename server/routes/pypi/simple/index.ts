import { defineEventHandler } from 'h3'
import { proxyPypiRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['PyPI Packages'],
    summary: 'List all projects',
    description:
      'Returns the complete unpaginated JSON index of registered PyPI projects and their serial numbers.',
    'x-docs': {
      platform: 'pypi',
      category: 'packages',
      endpoint: 'list',
      order: 400,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['PyPI 依赖包'],
        summary: '列出所有依赖包',
        description: '返回 PyPI 已注册依赖包及其序列号的完整 JSON 索引，不分页。',
      },
      'zh-TW': {
        tags: ['PyPI 套件'],
        summary: '列出所有套件',
        description: '傳回 PyPI 已註冊套件及其序號的完整 JSON 索引，不分頁。',
      },
      ja: {
        tags: ['PyPI パッケージ'],
        summary: '全パッケージ一覧を取得',
        description: '登録済み PyPI パッケージとシリアル番号の完全な JSON インデックスをページ分割せず返します。',
      },
      ko: {
        tags: ['PyPI 패키지'],
        summary: '모든 패키지 목록 조회',
        description: '등록된 PyPI 패키지와 일련번호의 전체 JSON 인덱스를 페이지 나누기 없이 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.pypi.org/api/index-api/#list-all-projects' },
    security: [],
    parameters: [
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
            schema: {
              type: 'object',
              additionalProperties: true,
              required: ['meta', 'projects'],
              properties: {
                meta: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    'api-version': { type: 'string' },
                    '_last-serial': { type: 'integer' },
                  },
                },
                projects: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: true,
                    properties: { name: { type: 'string' }, '_last-serial': { type: 'integer' } },
                  },
                },
              },
            },
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
    path: 'simple/',
    accept: 'application/vnd.pypi.simple.v1+json',
  })
})
