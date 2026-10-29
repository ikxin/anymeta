# AnyMeta

AnyMeta 为 GitHub、OpenCollective、npm 等平台的公开元数据提供匿名代理。GitHub 代理使用 GitHub App 安装令牌，OpenCollective 代理可以使用服务端 Personal Token；两者都不接收或保存调用者的个人访问令牌。

## 接口文档与调试

首页 `/` 使用 Nuxt UI 展示接口目录，每个接口通过 `/docs/{operationId}` 提供独立的文档与调试页面，例如 `/docs/getGithubRepository`、`/docs/githubGraphql`。页面支持直接访问、刷新和分享，未知接口返回 404；默认语言为英语，也支持简体中文、繁体中文、日语和韩语。

文档直接读取 Nitro 生成的 `/_openapi.json`。接口目录、参数、请求体和响应结构均来自路由的 `defineRouteMeta({ openAPI: ... })`。新增接口时声明 `summary` 或 `operationId` 即可出现在目录中，无需另行维护页面数据；未设置 `operationId` 时使用方法与路径组合生成标识。Nitro 自动生成的内部路由和页面兜底路由不会展示。

- 通过紧凑的分组侧栏浏览和搜索接口，点击目录进入各自独立的文档页面。
- 查看必填参数、默认值、枚举、响应状态，以及可展开的嵌套数据结构和示例。
- 正文展示参数与响应定义，右侧展示请求和响应示例；点击调试按钮，在弹窗中填写参数或编辑 JSON 请求体。GitHub 和 OpenCollective GraphQL 均提供可编辑的查询示例。
- 发送当前站点的真实请求，查看状态码、耗时、响应大小、响应体和响应头；支持取消请求，30 秒后自动超时。
- 复制随参数同步更新的 cURL、JavaScript 请求示例，切换明暗主题，在移动端使用接口目录。

调试请求由浏览器直接发往当前 AnyMeta 站点，不携带 Cookie。GitHub 接口仍需部署者配置服务端环境变量；配置缺失、上游限流等错误会显示在请求结果中。原始 OpenAPI 文档继续通过 `/_openapi.json` 提供，内置 Scalar 和 Swagger 页面已关闭。

## 国际化

使用 `@nuxtjs/i18n`，默认语言及缺失词条的回退语言均为英语。英语地址不带语言前缀，其余语言使用对应前缀；不根据浏览器语言自动跳转，因此访问 `/` 始终默认显示英语。

| 语言 | 语言代码 | 接口文档地址示例 |
| --- | --- | --- |
| 英语 | `en` | `/docs/getGithubRepository` |
| 简体中文 | `zh-CN` | `/zh-CN/docs/getGithubRepository` |
| 繁体中文 | `zh-TW` | `/zh-TW/docs/getGithubRepository` |
| 日语 | `ja` | `/ja/docs/getGithubRepository` |
| 韩语 | `ko` | `/ko/docs/getGithubRepository` |

桌面端侧栏底部、移动端页头的语言菜单会切换到当前接口的对应语言页面。目录及返回首页链接都会保留当前语言，Nuxt UI 内置提示、页面标题和 HTML 语言属性同步切换。

界面翻译按需加载，每种语言只保留 `i18n/locales/{语言代码}.json` 一个文件。文件内保留 `site` 和 `ui` 两个命名空间，分别管理页面导航和文档组件、请求调试。网站总述使用 `site.description`；新增界面词条时应同步补全五种语言。

接口文案直接维护在对应的 `server/routes/**` 路由文件中。标准 OpenAPI 字段保存默认英文，同一节点下的 `x-i18n` 保存其他语言的覆盖值，例如：

```ts
defineRouteMeta({
  openAPI: {
    operationId: 'getGithubRepository',
    summary: 'Get a repository',
    description: 'Returns metadata for a public GitHub repository.',
    'x-i18n': {
      'zh-CN': { summary: '获取仓库信息', description: '返回公开 GitHub 仓库的元数据。' },
      'zh-TW': { summary: '取得儲存庫資訊', description: '傳回公開 GitHub 儲存庫的中繼資料。' },
      ja: { summary: 'リポジトリ情報を取得', description: '公開 GitHub リポジトリのメタデータを返します。' },
      ko: { summary: '저장소 정보 조회', description: '공개 GitHub 저장소의 메타데이터를 반환합니다.' },
    },
  },
})
```

标题、说明和分组使用同一节点的 `title`、`summary`、`description`、`tags` 覆盖值。参数、请求体字段、响应和外部文档说明也按相同方式配置；共享参数与错误结构在现有的 `$global.components` 定义处维护一次，所有 `$ref` 引用自动复用。缺少语言或字段时保留默认英文。

`defineRouteMeta` 由 Nitro 静态提取，翻译必须写为对象字面量，不能调用函数或引用外部变量。前端通过 `app/utils/localize-openapi.ts` 读取 `x-i18n`，无需再维护接口词条文件或英文原文映射表。原始 `/_openapi.json` 保留英文标准字段和全部翻译扩展，供文档页面读取。

文档翻译只影响展示。真实 API 路径与 `/_openapi.json` 不加语言前缀，参数名、枚举、请求示例和实际响应内容不会被翻译。

## GitHub 代理

当前支持以下只读接口：

- `POST /github/graphql`
- `GET /github/orgs/{org}`
- `GET /github/orgs/{org}/repos`
- `GET /github/repos/{owner}/{repo}/contributors`
- `GET /github/repos/{owner}/{repo}/languages`
- `GET /github/repos/{owner}/{repo}/readme`
- `GET /github/repos/{owner}/{repo}/releases`
- `GET /github/repos/{owner}/{repo}/releases/latest`
- `GET /github/repos/{owner}/{repo}`
- `GET /github/search/issues`

REST、搜索和 GraphQL 分别维护额度状态。令牌池默认随机预热 5 个安全安装，在额度耗尽时逐步扩容，并在令牌续期时轮换安装来源，避免长期集中消耗少数安装者。安装令牌仅保存在进程内存中。GraphQL 入口只允许查询操作，并限制请求体、查询深度、字段数量、片段嵌套和分页数量。

REST 接口透传上游响应体、状态码以及内容类型、缓存、分页等响应头，不包装数据、不重命名字段、不汇总 Stars，也不自动跟随重定向；上游重定向通过原始状态码和 `Location` 返回。组织仓库列表保留上游分页行为，可使用 `type`、`sort`、`direction`、`per_page` 和 `page` 查询参数。

README 接口支持 `ref` 查询参数。未传入 `Accept` 时使用 `application/vnd.github+json`，保留包含 Base64 编码 `content` 的原始 JSON 对象；也可以通过 `Accept: application/vnd.github.raw+json` 或 `application/vnd.github.html+json` 请求上游提供的原文或 HTML。代理自身不解码或渲染 README。

## npmjs 代理

npmjs 代理仅访问 `api.npmjs.org`，统一使用 `/npmjs` 前缀，当前支持以下只读接口：

| 接口 | 上游 |
| --- | --- |
| `GET /npmjs/downloads/point/{period}/{package}` | `https://api.npmjs.org/downloads/point/{period}/{package}` |

`period` 支持 `last-day`、`last-week`、`last-month`、`last-year`、`YYYY-MM-DD` 和 `YYYY-MM-DD:YYYY-MM-DD`。下载统计支持单个普通包、单个作用域包，以及用逗号分隔的多个普通包；批量查询的限制和错误响应保持 npm 上游行为。

作用域包支持直接保留斜杠或将其编码为 `%2F`。例如，`/npmjs/downloads/point/last-month/@nuxt/kit` 和 `/npmjs/downloads/point/last-month/@nuxt%2Fkit` 都查询同一个包的下载量。请求示例：

```bash
curl http://localhost:3000/npmjs/downloads/point/last-month/nuxt
curl http://localhost:3000/npmjs/downloads/point/last-month/@nuxt/kit
curl http://localhost:3000/npmjs/downloads/point/last-month/nuxt,vue
```

npmjs 代理无需配置令牌，也不转发调用者的 Cookie 或认证头。响应体、状态码和内容类型、缓存等响应头直接透传，支持 `HEAD`、`If-None-Match` 和 `If-Modified-Since`，上游错误不转换成成功响应。代理固定访问上述官方 API 域名，不提供任意地址代理。

官方参考：[下载统计接口](https://github.com/npm/registry/blob/main/docs/download-counts.md)。

## OpenCollective 代理

当前提供以下接口：

- `POST /opencollective/graphql/v2/`

该接口兼容 OpenCollective GraphQL v2 的请求体，但只开放获取赞助者所需的公开字段：`collective`、`members`、成员账号、赞助层级和金额。接口拒绝 mutation、subscription、`me`、邮箱、付款资料以及白名单以外的字段，并限制请求体、查询深度、字段数量、片段嵌套、分页偏移和图片尺寸。

OpenCollective 官方允许未鉴权调用，每分钟最多 10 次；配置 Personal Token 后，每分钟额度提升到 100 次。AnyMeta 未配置 token 时会自动使用匿名额度，不会因此禁用接口。服务只会把 token 放在发往 OpenCollective 的 `Personal-Token` 请求头中，不会转发调用者提供的 Cookie 或认证头。

请求示例：

```bash
curl http://localhost:3000/opencollective/graphql/v2/ \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{"query":"query Members($slug: String!) { collective(slug: $slug) { members(limit: 100, role: [BACKER]) { totalCount nodes { account { name slug website imageUrl } tier { name amount { value currency } } } } } }","variables":{"slug":"nuxtjs"}}'
```

### 创建 OpenCollective Personal Token

公开查询不需要任何 OAuth scope。为降低共享代理的风险，建议使用一个不管理任何 Collective、组织或财务资料的专用个人账号创建 token，并按以下步骤操作：

1. 登录 [OpenCollective](https://opencollective.com/)，进入个人账号工作区。
2. 打开 `Settings` 下的 `For developers`。
3. 点击 `Create Personal Token`。
4. 名称可以填写 `AnyMeta`；不要选择任何 scope，也不要启用 `Advanced privileges`。
5. 建议设置到期时间，创建后立即复制 token，并保存到部署平台的服务端环境变量：

```dotenv
NUXT_OPEN_COLLECTIVE_TOKEN=你的_PERSONAL_TOKEN
```

不要使用 `NUXT_PUBLIC_` 前缀，也不要把真实 token 写入仓库。token 失效或填写错误时，上游会返回 `401`；删除该环境变量即可暂时退回匿名额度。

官方参考：[API 访问与额度](https://developers.opencollective.com/access)、[创建 Personal Token](https://documentation.opencollective.com/development/personal-tokens)。

## 创建 GitHub App

1. 登录 GitHub，打开 [GitHub App 设置](https://github.com/settings/apps)，也可以从头像菜单依次进入 `Settings`、`Developer settings`、`GitHub Apps`。
2. 点击 `New GitHub App`。
3. 按下面的要求填写应用：

| 设置项 | 填写内容 |
| --- | --- |
| GitHub App name | 一个全站唯一的名称，例如 `anymeta-example` |
| Description | 说明应用只为匿名公共元数据代理贡献 GitHub API 额度 |
| Homepage URL | AnyMeta 的公开地址；尚未部署时可填写项目仓库地址 |
| Callback URL | 留空 |
| Request user authorization during installation | 不启用 |
| Enable Device Flow | 不启用 |
| Setup URL | 留空 |
| Webhook Active | 关闭 |
| Repository permissions | 所有项目均选择 `No access` |
| Organization permissions | 所有项目均选择 `No access` |
| Account permissions | 所有项目均选择 `No access` |
| Where can this GitHub App be installed? | 仅自己使用时选 `Only on this account`；允许其他人贡献额度时选 `Any account` |

GitHub 固有的 `Metadata: Read-only` 无法关闭，保留即可。不要额外启用 `Contents`、`Issues`、`Pull requests` 等读权限，否则服务会拒绝该安装，防止匿名代理接触私有资源。

4. 点击 `Create GitHub App`。
5. 在新应用的设置页复制数字形式的 `App ID`。不要复制 `Client ID`。
6. 在 `Private keys` 区域点击 `Generate a private key`，GitHub 会下载一个 `.pem` 文件。
7. 打开应用左侧的 `Install App`，将应用安装到自己的个人账户或组织。仓库范围必须选择 `Only select repositories`，并且只选择一个公开仓库；不要选择私有仓库或 `All repositories`。

这个公开仓库只作为 GitHub 安装令牌的安全范围锚点，服务仍可读取全站公开资源。令牌池会拒绝包含私有仓库、多个仓库或额外权限的安装，防止匿名 REST/GraphQL 请求借用安装者的私有可见性。

若允许其他用户贡献独立额度，请选择 `Any account`，并公开 `https://github.com/apps/{应用标识}/installations/new`。安装确认页只显示一个公开仓库的元数据读取能力，不要求 OAuth 授权，这比索取个人访问令牌更容易被用户接受。

## 环境变量

复制 `.env.example` 为本地 `.env`。GitHub 代理需要填写前两个变量；OpenCollective Personal Token 可选：

```dotenv
NUXT_GITHUB_APP_ID=123456
NUXT_GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n完整私钥内容\n-----END RSA PRIVATE KEY-----"
NUXT_OPEN_COLLECTIVE_TOKEN=
```

| 变量 | 值的来源 |
| --- | --- |
| `NUXT_GITHUB_APP_ID` | GitHub App 设置页中的数字 `App ID` |
| `NUXT_GITHUB_APP_PRIVATE_KEY` | 下载的 `.pem` 文件的完整内容，包括开头和结尾标记 |
| `NUXT_OPEN_COLLECTIVE_TOKEN` | OpenCollective 个人工作区 `For developers` 中创建的 Personal Token；可留空 |

本地 `.env` 中可以把私钥写成一行，并用 `\n` 表示换行。Vercel、Netlify 等托管平台通常可以直接粘贴 `.pem` 文件的原始多行内容；代码同时支持这两种格式。

不需要填写以下值：

- `Client ID`
- `Client secret`
- Webhook secret
- Installation ID
- OAuth 用户令牌

服务固定使用 GitHub REST API `2026-03-10` 版本。服务会使用应用私钥签发短期应用 JWT，自动读取安全的安装列表，再向 GitHub 申请约一小时有效的安装令牌。签发响应只读取官方保证的 `token` 和 `expires_at`；安装权限从安装信息校验，仓库范围通过 `/installation/repositories` 校验，正式令牌会显式收窄到唯一的公开仓库，校验令牌随后立即撤销。

项目不保留旧的 40 字符安装令牌检测、回退或专用存储逻辑。GitHub App 安装令牌统一按不透明字符串处理，不检查长度，也不解析内部 JWT。生产代码不使用临时的 `X-GitHub-Stateless-S2S-Token` 切换请求头，由 GitHub 管理无状态 `ghs_APPID_JWT` 的服务端发布过程。

生产环境使用多个服务实例时，每个实例都有独立的内存令牌池。低流量部署可以直接使用；高流量多实例部署应再增加共享协调层，避免不同实例同时消耗同一安装额度。

GitHub 官方参考：[注册 GitHub App](https://docs.github.com/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)、[生成应用 JWT](https://docs.github.com/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app)、[生成安装令牌](https://docs.github.com/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)、[REST API 版本](https://docs.github.com/rest/about-the-rest-api/api-versions)、[无状态安装令牌公告](https://github.blog/changelog/2026-04-24-notice-about-upcoming-new-format-for-github-app-installation-tokens/)。

## 本地运行

安装依赖：

```bash
pnpm install
```

启动开发服务器：

```bash
pnpm dev
```

REST 请求示例：

```bash
curl http://localhost:3000/github/repos/unjs/ungh
```

GraphQL 请求示例：

```bash
curl http://localhost:3000/github/graphql \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{"query":"query { repository(owner: \"unjs\", name: \"ungh\") { name stargazerCount } }"}'
```

如果应用尚未安装、安装范围不安全、编号或私钥错误，GitHub 代理会返回 `503`。全部安装额度耗尽或处于冷却状态时会返回 `429` 和 `Retry-After`。
