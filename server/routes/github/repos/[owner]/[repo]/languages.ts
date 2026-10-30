import { defineEventHandler } from 'h3'
import { getGithubRepositoryPath, proxyGithubRequest } from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    operationId: 'listGithubRepositoryLanguages',
    tags: ['GitHub Repository'],
    summary: 'List repository languages',
    description: 'Returns the number of bytes of code written in each language.',
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 仓库'],
        summary: '列出仓库编程语言',
        description: '返回各编程语言所编写代码的字节数。',
      },
      'zh-TW': {
        tags: ['GitHub 儲存庫'],
        summary: '列出儲存庫程式語言',
        description: '傳回各程式語言所撰寫程式碼的位元組數。',
      },
      ja: {
        tags: ['GitHub リポジトリ'],
        summary: 'リポジトリの使用言語を取得',
        description: '各プログラミング言語で書かれたコードのバイト数を返します。',
      },
      ko: {
        tags: ['GitHub 저장소'],
        summary: '저장소 언어 목록 조회',
        description: '각 프로그래밍 언어로 작성된 코드의 바이트 수를 반환합니다.',
      },
    },
    externalDocs: {
      description: 'GitHub REST API documentation',
      'x-i18n': {
        'zh-CN': { description: 'GitHub REST API 文档' },
        'zh-TW': { description: 'GitHub REST API 文件' },
        ja: { description: 'GitHub REST API ドキュメント' },
        ko: { description: 'GitHub REST API 문서' },
      },
      url: 'https://docs.github.com/rest/repos/repos#list-repository-languages',
    },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      { $ref: '#/components/parameters/IfNoneMatch' },
      { $ref: '#/components/parameters/IfModifiedSince' },
    ],
    responses: {
      200: {
        description: 'A mapping of language names to the number of bytes of code.',
        'x-i18n': {
          'zh-CN': { description: '编程语言名称与代码字节数的映射。' },
          'zh-TW': { description: '程式語言名稱與程式碼位元組數的對應。' },
          ja: { description: '言語名とコードのバイト数の対応表。' },
          ko: { description: '언어 이름과 코드 바이트 수의 매핑.' },
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: {
                type: 'integer',
                minimum: 0,
              },
              example: {
                TypeScript: 78769,
                Vue: 7769,
              },
            },
          },
        },
      },
      304: {
        description: 'Not modified.',
        'x-i18n': {
          'zh-CN': { description: '内容未修改。' },
          'zh-TW': { description: '內容未修改。' },
          ja: { description: '変更されていません。' },
          ko: { description: '변경되지 않았습니다.' },
        },
      },
      default: {
        description: 'GitHub or AnyMeta returned an error.',
        'x-i18n': {
          'zh-CN': { description: 'GitHub 或 AnyMeta 返回了错误。' },
          'zh-TW': { description: 'GitHub 或 AnyMeta 傳回了錯誤。' },
          ja: { description: 'GitHub または AnyMeta がエラーを返しました。' },
          ko: { description: 'GitHub 또는 AnyMeta가 오류를 반환했습니다.' },
        },
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/GithubProxyError' },
          },
        },
      },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubRepositoryPath(event, 'languages'),
    resource: 'core',
  })
})
