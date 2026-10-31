import { defineEventHandler } from 'h3'
import { getGithubRepositoryPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Issues'],
    summary: 'List repository issues',
    description:
      'Lists repository issues with filters and pagination. GitHub also includes pull requests, identified by the pull_request field.',
    'x-docs': {
      platform: 'github',
      category: 'issues',
      endpoint: 'list',
      order: 92,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 议题'],
        summary: '列出仓库议题',
        description: '按条件分页列出仓库议题。GitHub 也会返回拉取请求，可通过 pull_request 字段识别。',
      },
      'zh-TW': {
        tags: ['GitHub 議題'],
        summary: '列出儲存庫議題',
        description: '依條件分頁列出儲存庫議題。GitHub 也會傳回提取要求，可透過 pull_request 欄位識別。',
      },
      ja: {
        tags: ['GitHub Issue'],
        summary: 'リポジトリの Issue 一覧を取得',
        description: 'リポジトリの Issue を条件とページ分割で取得します。pull_request フィールドを持つプルリクエストも含みます。',
      },
      ko: {
        tags: ['GitHub 이슈'],
        summary: '저장소 이슈 목록 조회',
        description: '저장소 이슈를 필터 및 페이지 나누기로 반환합니다. pull_request 필드로 식별되는 풀 리퀘스트도 포함합니다.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/issues/issues#list-repository-issues' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'state',
        in: 'query',
        description: 'Filter by state.',
        'x-i18n': {
          'zh-CN': { description: '按状态筛选。' },
          'zh-TW': { description: '依狀態篩選。' },
          ja: { description: '状態で絞り込みます。' },
          ko: { description: '상태로 필터링합니다.' },
        },
        schema: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
      },
      {
        name: 'milestone',
        in: 'query',
        description: 'Milestone number, * for any, or none.',
        'x-i18n': {
          'zh-CN': { description: '里程碑编号，* 表示任意里程碑，none 表示无里程碑。' },
          'zh-TW': { description: '里程碑編號，* 表示任意里程碑，none 表示無里程碑。' },
          ja: { description: 'マイルストーン番号。* は任意、none は未設定。' },
          ko: { description: '마일스톤 번호. *는 모두, none은 미지정.' },
        },
        schema: { type: 'string' },
      },
      {
        name: 'assignee',
        in: 'query',
        description: 'Assignee username, * for any, or none.',
        'x-i18n': {
          'zh-CN': { description: '受指派者用户名，* 表示任意用户，none 表示未指派。' },
          'zh-TW': { description: '受指派者名稱，* 表示任意使用者，none 表示未指派。' },
          ja: { description: '担当者のユーザー名。* は任意、none は未割り当て。' },
          ko: { description: '담당자 이름. *는 모두, none은 미할당.' },
        },
        schema: { type: 'string' },
      },
      {
        name: 'creator',
        in: 'query',
        description: 'Issue creator username.',
        'x-i18n': {
          'zh-CN': { description: '议题创建者用户名。' },
          'zh-TW': { description: '議題建立者名稱。' },
          ja: { description: 'Issue 作成者のユーザー名。' },
          ko: { description: '이슈 작성자 이름.' },
        },
        schema: { type: 'string' },
      },
      {
        name: 'mentioned',
        in: 'query',
        description: 'Mentioned username.',
        'x-i18n': {
          'zh-CN': { description: '被提及的用户名。' },
          'zh-TW': { description: '被提及的使用者名稱。' },
          ja: { description: 'メンションされたユーザー名。' },
          ko: { description: '멘션된 사용자 이름.' },
        },
        schema: { type: 'string' },
      },
      {
        name: 'labels',
        in: 'query',
        description: 'Comma-separated label names.',
        'x-i18n': {
          'zh-CN': { description: '用逗号分隔的标签名称。' },
          'zh-TW': { description: '以逗號分隔的標籤名稱。' },
          ja: { description: 'カンマ区切りのラベル名。' },
          ko: { description: '쉼표로 구분한 레이블 이름.' },
        },
        schema: { type: 'string' },
      },
      {
        name: 'sort',
        in: 'query',
        description: 'Sort field.',
        'x-i18n': {
          'zh-CN': { description: '排序字段。' },
          'zh-TW': { description: '排序欄位。' },
          ja: { description: '並べ替え項目。' },
          ko: { description: '정렬 필드.' },
        },
        schema: { type: 'string', enum: ['created', 'updated', 'comments'], default: 'created' },
      },
      {
        name: 'direction',
        in: 'query',
        description: 'Sort direction.',
        'x-i18n': {
          'zh-CN': { description: '排序方向。' },
          'zh-TW': { description: '排序方向。' },
          ja: { description: '並び順。' },
          ko: { description: '정렬 방향.' },
        },
        schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
      },
      {
        name: 'since',
        in: 'query',
        description: 'Only results after this ISO 8601 timestamp.',
        'x-i18n': {
          'zh-CN': { description: '仅返回此 ISO 8601 时间之后的结果。' },
          'zh-TW': { description: '僅傳回此 ISO 8601 時間之後的結果。' },
          ja: { description: 'この ISO 8601 日時以降の結果。' },
          ko: { description: '이 ISO 8601 시간 이후의 결과.' },
        },
        schema: { type: 'string', format: 'date-time' },
      },
      { $ref: '#/components/parameters/GithubPerPage' },
      { $ref: '#/components/parameters/GithubPage' },
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
            schema: { type: 'array', items: { $ref: '#/components/schemas/GithubIssue' } },
          },
        },
      },
      304: { $ref: '#/components/responses/GithubNotModified' },
      default: { $ref: '#/components/responses/GithubError' },
    },
    $global: {
      components: {
        schemas: {
          GithubIssue: {
            type: 'object',
            additionalProperties: true,
            required: ['id', 'number', 'title', 'state'],
            properties: {
              id: { type: 'integer' },
              number: { type: 'integer' },
              title: { type: 'string' },
              state: { type: 'string' },
              state_reason: { type: ['string', 'null'] },
              body: { type: ['string', 'null'] },
              html_url: { type: 'string', format: 'uri' },
              user: {
                anyOf: [{ $ref: '#/components/schemas/GithubUserSummary' }, { type: 'null' }],
              },
              assignees: {
                type: 'array',
                items: { $ref: '#/components/schemas/GithubUserSummary' },
              },
              labels: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    color: { type: 'string' },
                    description: { type: ['string', 'null'] },
                  },
                },
              },
              comments: { type: 'integer', minimum: 0 },
              locked: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              closed_at: { type: ['string', 'null'], format: 'date-time' },
              pull_request: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  url: { type: 'string', format: 'uri' },
                  html_url: { type: 'string', format: 'uri' },
                  diff_url: { type: 'string', format: 'uri' },
                  patch_url: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
      },
    },
  },
})

export default defineEventHandler((event) => {
  return proxyGithubRequest(event, {
    path: getGithubRepositoryPath(event, 'issues'),
    resource: 'core',
  })
})
