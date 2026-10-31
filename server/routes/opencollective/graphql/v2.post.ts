import { createError, defineEventHandler, readRawBody } from 'h3'
import { GraphqlValidationError } from '#server/utils/graphql'
import {
  proxyOpenCollectiveGraphql,
  validateOpenCollectiveGraphqlBody,
} from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['OpenCollective GraphQL'],
    summary: 'Query public OpenCollective sponsorship metadata',
    description:
      'Queries public Collective, member, tier, and amount metadata with a server-side Personal Token. Only allowlisted query fields are available; mutations, identity data, and payment data are rejected. When no Personal Token is configured, the OpenCollective anonymous allowance is used.',
    'x-docs': {
      platform: 'opencollective',
      category: 'graphql',
      endpoint: 'v2',
      order: 200,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['OpenCollective GraphQL'],
        summary: '查询 OpenCollective 公开赞助元数据',
        description:
          '使用服务端个人令牌查询公开的 Collective、成员、档位和金额元数据。仅允许查询许可列表中的字段；不允许变更操作，也不允许访问身份和支付数据。未配置个人令牌时，使用 OpenCollective 的匿名访问配额。',
      },
      'zh-TW': {
        tags: ['OpenCollective GraphQL'],
        summary: '查詢 OpenCollective 公開贊助中繼資料',
        description:
          '使用伺服器端個人權杖查詢公開的 Collective、成員、級別和金額中繼資料。僅允許查詢允許清單中的欄位；不允許異動操作，也不允許存取身分和付款資料。未設定個人權杖時，使用 OpenCollective 的匿名存取配額。',
      },
      ja: {
        tags: ['OpenCollective GraphQL'],
        summary: 'OpenCollective の公開スポンサーシップメタデータを照会',
        description:
          'サーバー側の Personal Token を使って、公開されている Collective、メンバー、ティア、金額のメタデータを照会します。許可リストに含まれるクエリフィールドのみ利用でき、ミューテーション、本人識別データ、支払いデータへのアクセスは拒否されます。Personal Token が未設定の場合は OpenCollective の匿名アクセス枠を使用します。',
      },
      ko: {
        tags: ['OpenCollective GraphQL'],
        summary: 'OpenCollective 공개 후원 메타데이터 조회',
        description:
          '서버 측 Personal Token으로 공개 Collective, 회원, 등급 및 금액 메타데이터를 조회합니다. 허용 목록에 있는 쿼리 필드만 사용할 수 있으며, 뮤테이션과 신원 및 결제 데이터 접근은 거부됩니다. Personal Token이 설정되지 않은 경우 OpenCollective 익명 접근 할당량을 사용합니다.',
      },
    },
    externalDocs: {
      description: 'OpenCollective GraphQL API documentation',
      'x-i18n': {
        'zh-CN': { description: 'OpenCollective GraphQL API 文档' },
        'zh-TW': { description: 'OpenCollective GraphQL API 文件' },
        ja: { description: 'OpenCollective GraphQL API ドキュメント' },
        ko: { description: 'OpenCollective GraphQL API 문서' },
      },
      url: 'https://developers.opencollective.com/access',
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
                  'Only public collective, members, tier, account, and amount fields can be queried.',
                'x-i18n': {
                  'zh-CN': {
                    description:
                      '仅可查询公开的 collective、members、tier、account 和 amount 字段。',
                  },
                  'zh-TW': {
                    description:
                      '僅可查詢公開的 collective、members、tier、account 和 amount 欄位。',
                  },
                  ja: {
                    description:
                      '公開されている collective、members、tier、account、amount フィールドのみ照会できます。',
                  },
                  ko: {
                    description:
                      '공개 collective, members, tier, account 및 amount 필드만 조회할 수 있습니다.',
                  },
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
              'query Members($slug: String!) { collective(slug: $slug) { members(limit: 100, role: [BACKER]) { totalCount nodes { account { name slug website imageUrl } tier { name amount { value currency } } } } } }',
            variables: {
              slug: 'nuxtjs',
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'OpenCollective GraphQL response.',
        'x-i18n': {
          'zh-CN': { description: 'OpenCollective GraphQL 响应。' },
          'zh-TW': { description: 'OpenCollective GraphQL 回應。' },
          ja: { description: 'OpenCollective GraphQL レスポンス。' },
          ko: { description: 'OpenCollective GraphQL 응답.' },
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
              $ref: '#/components/schemas/OpenCollectiveProxyError',
            },
          },
        },
      },
      default: {
        description: 'OpenCollective or AnyMeta returned an error.',
        'x-i18n': {
          'zh-CN': { description: 'OpenCollective 或 AnyMeta 返回了错误。' },
          'zh-TW': { description: 'OpenCollective 或 AnyMeta 傳回了錯誤。' },
          ja: { description: 'OpenCollective または AnyMeta がエラーを返しました。' },
          ko: { description: 'OpenCollective 또는 AnyMeta가 오류를 반환했습니다.' },
        },
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/OpenCollectiveProxyError',
            },
          },
        },
      },
    },
    $global: {
      components: {
        schemas: {
          OpenCollectiveProxyError: {
            type: 'object',
            description: 'An OpenCollective upstream error or an AnyMeta proxy error.',
            'x-i18n': {
              'zh-CN': { description: 'OpenCollective 上游错误或 AnyMeta 代理错误。' },
              'zh-TW': { description: 'OpenCollective 上游錯誤或 AnyMeta 代理錯誤。' },
              ja: { description: 'OpenCollective の上流エラーまたは AnyMeta のプロキシエラー。' },
              ko: { description: 'OpenCollective 업스트림 오류 또는 AnyMeta 프록시 오류입니다.' },
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
    body = validateOpenCollectiveGraphqlBody(await readRawBody(event, 'utf8'))
  } catch (error) {
    if (error instanceof GraphqlValidationError) {
      throw createError({ statusCode: 400, message: error.message })
    }
    throw error
  }

  return proxyOpenCollectiveGraphql(event, body)
})
