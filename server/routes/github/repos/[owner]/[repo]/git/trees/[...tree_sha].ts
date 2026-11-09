import { defineEventHandler } from 'h3'
import { getGithubRepositoryRefPath, proxyGithubRequest } from '#server/utils/proxy'

defineRouteMeta({
  openAPI: {
    tags: ['GitHub Repository'],
    summary: 'Get a repository tree',
    description:
      'Returns a public repository tree for a tree hash, branch, or tag. Recursive results can be truncated; inspect the truncated field.',
    'x-docs': {
      platform: 'github',
      category: 'repos',
      endpoint: 'tree',
      order: 81,
    },
    'x-i18n': {
      'zh-CN': {
        tags: ['GitHub 仓库'],
        summary: '获取仓库目录树',
        description: '按树哈希、分支或标签获取公开仓库的目录树。递归结果可能被截断，请检查 truncated 字段。',
      },
      'zh-TW': {
        tags: ['GitHub 儲存庫'],
        summary: '取得儲存庫目錄樹',
        description: '依樹雜湊、分支或標籤取得公開儲存庫的目錄樹。遞迴結果可能被截斷，請檢查 truncated 欄位。',
      },
      ja: {
        tags: ['GitHub リポジトリ'],
        summary: 'リポジトリのツリーを取得',
        description: 'ツリーハッシュ、ブランチ、タグで公開リポジトリのツリーを取得します。再帰結果は省略される場合があるため、truncated フィールドを確認してください。',
      },
      ko: {
        tags: ['GitHub 저장소'],
        summary: '저장소 트리 조회',
        description: '트리 해시, 브랜치 또는 태그로 공개 저장소 트리를 조회합니다. 재귀 결과가 잘릴 수 있으므로 truncated 필드를 확인하세요.',
      },
    },
    externalDocs: { url: 'https://docs.github.com/rest/git/trees#get-a-tree' },
    security: [],
    parameters: [
      { $ref: '#/components/parameters/GithubOwner' },
      { $ref: '#/components/parameters/GithubRepository' },
      {
        name: 'tree_sha',
        in: 'path',
        required: true,
        description:
          'A tree SHA1 hash, branch, or tag. Encode slashes when using a single path segment.',
        'x-i18n': {
          'zh-CN': { description: '树的 SHA1 哈希、分支或标签，作为单个路径段使用时需编码斜杠。' },
          'zh-TW': { description: '樹的 SHA1 雜湊、分支或標籤，作為單一路徑區段使用時需編碼斜線。' },
          ja: { description: 'ツリーの SHA1 ハッシュ、ブランチ、タグ。単一のパス要素ではスラッシュをエンコードします。' },
          ko: { description: '트리 SHA1 해시, 브랜치 또는 태그. 단일 경로 세그먼트에서는 슬래시를 인코딩합니다.' },
        },
        schema: { type: 'string' },
        example: 'main',
      },
      {
        name: 'recursive',
        in: 'query',
        description:
          'Any value enables recursion, including 0 and false. Omit this parameter for a non-recursive tree.',
        'x-i18n': {
          'zh-CN': { description: '传入任意值都会启用递归，包括 0 和 false。不递归时请省略此参数。' },
          'zh-TW': { description: '傳入任意值都會啟用遞迴，包括 0 和 false。不遞迴時請省略此參數。' },
          ja: { description: '0 や false を含む任意の値で再帰を有効にします。再帰しない場合は省略してください。' },
          ko: { description: '0과 false를 포함한 모든 값이 재귀를 활성화합니다. 재귀하지 않으려면 이 매개변수를 생략하세요.' },
        },
        schema: { type: 'string' },
        example: '1',
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
              type: 'object',
              additionalProperties: true,
              required: ['sha', 'tree', 'truncated'],
              properties: {
                sha: { type: 'string' },
                url: { type: 'string', format: 'uri' },
                tree: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: true,
                    required: ['path', 'mode', 'type', 'sha'],
                    properties: {
                      path: { type: 'string' },
                      mode: {
                        type: 'string',
                        enum: ['100644', '100755', '040000', '160000', '120000'],
                      },
                      type: { type: 'string', enum: ['blob', 'tree', 'commit'] },
                      sha: { type: 'string' },
                      size: { type: 'integer', minimum: 0 },
                      url: { type: 'string', format: 'uri' },
                    },
                  },
                },
                truncated: { type: 'boolean' },
              },
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
    path: getGithubRepositoryRefPath(event, 'git/trees'),
    resource: 'core',
  })
})
