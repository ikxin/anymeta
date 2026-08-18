# AnyMeta

AnyMeta 为 GitHub、npm 等平台的公开元数据提供匿名代理。GitHub 代理使用 GitHub App 安装令牌，不接收或保存用户个人访问令牌。

## GitHub 代理

当前支持以下只读接口：

- `POST /github/graphql`
- `GET /github/repos/{owner}/{repo}/contributors`
- `GET /github/repos/{owner}/{repo}/languages`
- `GET /github/repos/{owner}/{repo}/releases`
- `GET /github/repos/{owner}/{repo}`
- `GET /github/search/issues`

REST、搜索和 GraphQL 分别维护额度状态。令牌池默认随机预热 5 个安全安装，在额度耗尽时逐步扩容，并在令牌续期时轮换安装来源，避免长期集中消耗少数安装者。安装令牌仅保存在进程内存中。GraphQL 入口只允许查询操作，并限制请求体、查询深度、字段数量、片段嵌套和分页数量。

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

复制 `.env.example` 为本地 `.env`，填写下面两个变量：

```dotenv
NUXT_GITHUB_APP_ID=123456
NUXT_GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n完整私钥内容\n-----END RSA PRIVATE KEY-----"
```

| 变量 | 值的来源 |
| --- | --- |
| `NUXT_GITHUB_APP_ID` | GitHub App 设置页中的数字 `App ID` |
| `NUXT_GITHUB_APP_PRIVATE_KEY` | 下载的 `.pem` 文件的完整内容，包括开头和结尾标记 |

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
