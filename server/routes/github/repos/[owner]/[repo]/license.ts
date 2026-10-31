import { defineEventHandler } from 'h3'
import { getGithubRepositoryPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Repository'],
    summary: 'Get repository license',
    description: 'Returns the detected repository license and its Base64-encoded file content.',
    'x-docs': {
      platform: 'github',
      category: 'repos',
      endpoint: 'license',
      order: 77,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 仓库'],
        summary: '获取仓库许可证',
        description: '返回识别到的仓库许可证信息及其 Base64 编码的文件内容。',
      },
      'zh-TW': {
        tags: ['GitHub 儲存庫'],
        summary: '取得儲存庫授權條款',
        description: '傳回辨識到的儲存庫授權條款資訊及其 Base64 編碼的檔案內容。',
      },
      ja: {
        tags: ['GitHub リポジトリ'],
        summary: 'リポジトリのライセンスを取得',
        description: '検出されたリポジトリのライセンス情報と Base64 形式のファイル内容を返します。',
      },
      ko: {
        tags: ['GitHub 저장소'],
        summary: '저장소 라이선스 조회',
        description: '감지된 저장소 라이선스 정보와 Base64로 인코딩된 파일 콘텐츠를 반환합니다.',
      },
    },
    externalDocs: {
      url: 'https://docs.github.com/rest/licenses/licenses#get-the-license-for-a-repository',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'ref',
        in: 'query',
        description: 'A Git reference, such as refs/heads/main.',
        'x-i18n': {
          'zh-CN': { description: 'Git 引用，例如 refs/heads/main。' },
          'zh-TW': { description: 'Git 參照，例如 refs/heads/main。' },
          ja: { description: 'refs/heads/main などの Git 参照。' },
          ko: { description: 'refs/heads/main 등의 Git 참조.' },
        },
        schema: { type: 'string' },
      },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'The original GitHub response.',
        'x-i18n': {
          'zh-CN': { description: 'GitHub 原始响应。' },
          'zh-TW': { description: 'GitHub 原始回應。' },
          ja: { description: 'GitHub の元のレスポンス。' },
          ko: { description: 'GitHub 원본 응답.' },
        },
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/GithubContent' },
                {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    license: {
                      type: 'object',
                      additionalProperties: true,
                      properties: {
                        key: { type: 'string' },
                        name: { type: 'string' },
                        spdx_id: { type: 'string' },
                        url: { anyOf: [{ type: 'string', format: 'uri' }, { type: 'null' }] },
                        html_url: { type: 'string', format: 'uri' },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
      304: { $ref: '#/components/responses/GithubNotModified' },
      default: { $ref: '#/components/responses/GithubError' },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubRepositoryPath(event, 'license'),
    resource: 'core',
  })
})
