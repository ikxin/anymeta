import { defineEventHandler } from 'h3'
import { getCratesPackagePath, proxyCratesRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['crates.io Packages'],
    summary: 'List crate owners',
    description: 'Returns the public user and team owners of a crate.',
    'x-docs': {
      platform: 'crates',
      category: 'packages',
      endpoint: 'owners',
      order: 260,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['crates.io 依赖包'],
        summary: '列出依赖包维护者',
        description: '返回依赖包公开的用户和团队维护者。',
      },
      'zh-TW': {
        tags: ['crates.io 套件'],
        summary: '列出套件維護者',
        description: '傳回套件公開的使用者和團隊維護者。',
      },
      ja: {
        tags: ['crates.io パッケージ'],
        summary: 'パッケージのオーナー一覧を取得',
        description: 'パッケージの公開ユーザーおよびチームオーナーを返します。',
      },
      ko: {
        tags: ['crates.io 패키지'],
        summary: '패키지 소유자 목록 조회',
        description: '패키지의 공개 사용자 및 팀 소유자를 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://github.com/rust-lang/crates.io/blob/main/src/controllers/krate/owners.rs',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/CratesName' },
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
                users: {
                  type: 'array',
                  items: {
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
    path: getCratesPackagePath(event, 'owners'),
  })
})
