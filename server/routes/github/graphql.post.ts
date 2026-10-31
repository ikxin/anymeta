import { createError, defineEventHandler, readRawBody } from 'h3'
import {
  GithubGraphqlValidationError,
  validateGithubGraphqlBody,
} from '#server/utils/github-graphql'
import { proxyGithubRequest } from '#server/utils/github-proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub GraphQL'],
    summary: 'Run a GitHub GraphQL query',
    description:
      'Runs a read-only GraphQL query with a shared GitHub App installation access token.',
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub GraphQL'],
        summary: '执行 GitHub GraphQL 查询',
        description: '使用共享的 GitHub App 安装访问令牌执行只读 GraphQL 查询。',
      },
      'zh-TW': {
        tags: ['GitHub GraphQL'],
        summary: '執行 GitHub GraphQL 查詢',
        description: '使用共用的 GitHub App 安裝存取權杖執行唯讀 GraphQL 查詢。',
      },
      ja: {
        tags: ['GitHub GraphQL'],
        summary: 'GitHub GraphQL クエリを実行',
        description:
          '共有の GitHub App インストールアクセストークンを使って、読み取り専用の GraphQL クエリを実行します。',
      },
      ko: {
        tags: ['GitHub GraphQL'],
        summary: 'GitHub GraphQL 쿼리 실행',
        description: '공유 GitHub App 설치 액세스 토큰으로 읽기 전용 GraphQL 쿼리를 실행합니다.',
      },
    },
    externalDocs: {
      description: 'GitHub GraphQL API documentation',
      'x-i18n': {
        'zh-CN': { description: 'GitHub GraphQL API 文档' },
        'zh-TW': { description: 'GitHub GraphQL API 文件' },
        ja: { description: 'GitHub GraphQL API ドキュメント' },
        ko: { description: 'GitHub GraphQL API 문서' },
      },
      url: 'https://docs.github.com/graphql',
    },
    security: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['query'],
            additionalProperties: true,
            properties: {
              query: {
                type: 'string',
                description:
                  'Only query operations are allowed; mutations and subscriptions are rejected.',
                'x-i18n': {
                  'zh-CN': { description: '仅允许查询操作；不允许变更和订阅操作。' },
                  'zh-TW': { description: '僅允許查詢操作；不允許異動和訂閱操作。' },
                  ja: {
                    description:
                      'クエリ操作のみ利用できます。ミューテーションとサブスクリプションは拒否されます。',
                  },
                  ko: { description: '쿼리 작업만 허용됩니다. 뮤테이션과 구독은 거부됩니다.' },
                },
              },
              operationName: {
                type: ['string', 'null'],
              },
              variables: {
                type: ['object', 'null'],
                additionalProperties: true,
              },
            },
          },
          example: {
            query:
              'query Repository($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { name description stargazerCount forkCount url } }',
            variables: {
              owner: 'unjs',
              name: 'ungh',
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'GitHub GraphQL response.',
        'x-i18n': {
          'zh-CN': { description: 'GitHub GraphQL 响应。' },
          'zh-TW': { description: 'GitHub GraphQL 回應。' },
          ja: { description: 'GitHub GraphQL レスポンス。' },
          ko: { description: 'GitHub GraphQL 응답.' },
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
              properties: {
                data: {
                  type: ['object', 'null'],
                  additionalProperties: true,
                },
                errors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: true,
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: 'The request body or GraphQL query violates the anonymous proxy limits.',
        'x-i18n': {
          'zh-CN': { description: '请求体或 GraphQL 查询违反了匿名代理的限制。' },
          'zh-TW': { description: '請求主體或 GraphQL 查詢違反了匿名代理的限制。' },
          ja: {
            description:
              'リクエストボディまたは GraphQL クエリが匿名プロキシの制限に違反しています。',
          },
          ko: { description: '요청 본문 또는 GraphQL 쿼리가 익명 프록시 제한을 위반했습니다.' },
        },
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/GithubProxyError',
            },
          },
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
            schema: {
              $ref: '#/components/schemas/GithubProxyError',
            },
          },
        },
      },
    },
    $global: {
      components: {
        parameters: {
          GithubOwner: {
            name: 'owner',
            in: 'path',
            required: true,
            description: 'The repository owner login. The value is case-insensitive.',
            'x-i18n': {
              'zh-CN': { description: '仓库所有者的登录名，不区分大小写。' },
              'zh-TW': { description: '儲存庫擁有者的登入名稱，不區分大小寫。' },
              ja: { description: 'リポジトリ所有者のログイン名。大文字と小文字は区別されません。' },
              ko: {
                description: '저장소 소유자의 로그인 이름입니다. 대소문자를 구분하지 않습니다.',
              },
            },
            schema: {
              type: 'string',
            },
            example: 'unjs',
          },
          GithubRepository: {
            name: 'repo',
            in: 'path',
            required: true,
            description:
              'The repository name without the .git suffix. The value is case-insensitive.',
            'x-i18n': {
              'zh-CN': { description: '不含 .git 后缀的仓库名称，不区分大小写。' },
              'zh-TW': { description: '不含 .git 後綴的儲存庫名稱，不區分大小寫。' },
              ja: {
                description:
                  '.git サフィックスを含まないリポジトリ名。大文字と小文字は区別されません。',
              },
              ko: {
                description:
                  '.git 접미사를 제외한 저장소 이름입니다. 대소문자를 구분하지 않습니다.',
              },
            },
            schema: {
              type: 'string',
            },
            example: 'ungh',
          },
          GithubPage: {
            name: 'page',
            in: 'query',
            description: 'The page number to fetch.',
            'x-i18n': {
              'zh-CN': { description: '要获取的页码。' },
              'zh-TW': { description: '要取得的頁碼。' },
              ja: { description: '取得するページ番号。' },
              ko: { description: '가져올 페이지 번호입니다.' },
            },
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1,
            },
          },
          GithubPerPage: {
            name: 'per_page',
            in: 'query',
            description: 'The number of results to return per page.',
            'x-i18n': {
              'zh-CN': { description: '每页返回的结果数量。' },
              'zh-TW': { description: '每頁傳回的結果數量。' },
              ja: { description: '1 ページあたりに返す結果の件数。' },
              ko: { description: '페이지당 반환할 결과 수입니다.' },
            },
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 30,
            },
          },
          IfNoneMatch: {
            name: 'If-None-Match',
            in: 'header',
            description: 'An ETag for conditional requests.',
            'x-i18n': {
              'zh-CN': { description: '用于条件请求的 ETag。' },
              'zh-TW': { description: '用於條件式請求的 ETag。' },
              ja: { description: '条件付きリクエストに使用する ETag。' },
              ko: { description: '조건부 요청에 사용할 ETag입니다.' },
            },
            schema: {
              type: 'string',
            },
          },
          IfModifiedSince: {
            name: 'If-Modified-Since',
            in: 'header',
            description: 'An HTTP date for conditional requests.',
            'x-i18n': {
              'zh-CN': { description: '用于条件请求的 HTTP 日期。' },
              'zh-TW': { description: '用於條件式請求的 HTTP 日期。' },
              ja: { description: '条件付きリクエストに使用する HTTP 日付。' },
              ko: { description: '조건부 요청에 사용할 HTTP 날짜입니다.' },
            },
            schema: {
              type: 'string',
            },
          },
        },
        schemas: {
          GithubProxyError: {
            type: 'object',
            description: 'A GitHub upstream error or an AnyMeta proxy error.',
            'x-i18n': {
              'zh-CN': { description: 'GitHub 上游错误或 AnyMeta 代理错误。' },
              'zh-TW': { description: 'GitHub 上游錯誤或 AnyMeta 代理錯誤。' },
              ja: { description: 'GitHub の上流エラーまたは AnyMeta のプロキシエラー。' },
              ko: { description: 'GitHub 업스트림 오류 또는 AnyMeta 프록시 오류입니다.' },
            },
            additionalProperties: true,
            properties: {
              message: {
                type: 'string',
              },
              statusCode: {
                type: 'integer',
              },
              statusMessage: {
                type: 'string',
              },
              documentation_url: {
                type: 'string',
                format: 'uri',
              },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  let body: string
  try {
    body = validateGithubGraphqlBody(await readRawBody(event, 'utf8'))
  } catch (error) {
    if (error instanceof GithubGraphqlValidationError) {
      throw createError({ statusCode: 400, message: error.message })
    }
    throw error
  }

  return proxyGithubRequest(event, {
    path: 'graphql',
    resource: 'graphql',
    method: 'POST',
    body,
    contentType: 'application/json',
  })
})
