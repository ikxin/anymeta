import { defineEventHandler } from 'h3'
import { getPypiProjectPath, proxyPypiRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['PyPI Provenance'],
    summary: 'Get file provenance',
    description:
      'Returns the original provenance bundles and publishing identities for a distribution file.',
    'x-docs': {
      platform: 'pypi',
      category: 'integrity',
      endpoint: 'provenance',
      order: 410,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['PyPI 来源证明'],
        summary: '获取文件来源证明',
        description: '返回分发文件的原始来源证明材料和发布者身份。',
      },
      'zh-TW': {
        tags: ['PyPI 來源證明'],
        summary: '取得檔案來源證明',
        description: '傳回散布檔案的原始來源證明材料和發行者身分。',
      },
      ja: {
        tags: ['PyPI 来歴情報'],
        summary: 'ファイルの来歴情報を取得',
        description: '配布ファイルの元の来歴情報と公開者の識別情報を返します。',
      },
      ko: {
        tags: ['PyPI 출처 증명'],
        summary: '파일 출처 증명 조회',
        description: '배포 파일의 원본 출처 증명 자료와 게시자 신원을 반환합니다.',
      },
    },
    externalDocs: { url: 'https://docs.pypi.org/api/integrity/#get-provenance-for-file' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/PypiProject' },
      { $ref: '#/components/parameters/PypiVersion' },
      { $ref: '#/components/parameters/PypiFilename' },
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
          'application/vnd.pypi.integrity.v1+json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              required: ['attestation_bundles'],
              properties: {
                attestation_bundles: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                      publisher: {
                        type: 'object',
                        additionalProperties: true,
                        properties: {
                          kind: { type: 'string' },
                          repository: { type: 'string' },
                          workflow: { type: 'string' },
                          environment: { type: 'string' },
                        },
                      },
                      attestations: {
                        type: 'array',
                        items: {
                          type: 'object',
                          additionalProperties: true,
                          properties: {
                            version: { type: 'integer' },
                            envelope: {
                              type: 'object',
                              additionalProperties: true,
                              properties: {
                                signature: { type: 'string' },
                                statement: { type: 'string' },
                              },
                            },
                            verification_material: { type: 'object', additionalProperties: true },
                          },
                        },
                      },
                    },
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
    path: getPypiProjectPath(event, 'provenance'),
    accept: 'application/vnd.pypi.integrity.v1+json',
  })
})
