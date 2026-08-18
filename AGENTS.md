## 项目介绍

该项目用于代理 GitHub、npmjs、crates.io、PyPI 等平台的公开 API 接口，实现无 Token 访问公开 Meta 元数据。

使用技术栈为 Nuxt、Nitro、Vite 和 Rolldown。

当前项目的灵感来源于 [ungh](https://github.com/unjs/ungh) 仓库，关于 Token 池的关键逻辑实现需要参考 [ungh](https://github.com/unjs/ungh) 的实现。

## 路由设计

当前阶段只需要支持 GitHub 和 npmjs 的部分接口，分别以 /github/{path} 和 /npm/{path} 作为 API 接口前缀，再拼接上游 API 的路径。

**GitHub API**

- `https://api.github.com/graphql`
- `https://api.github.com/repos/{owner}/{repo}/contributors`
- `https://api.github.com/repos/{owner}/{repo}/languages`
- `https://api.github.com/repos/{owner}/{repo}/releases`
- `https://api.github.com/repos/{owner}/{repo}`
- `https://api.github.com/search/issues`

**npmjs API**

- `https://api.npmjs.org/downloads/point/{period}/{package}`
- `https://api.npmjs.org/downloads/point/{period}/{package1},{package2},...`
- `https://api.npmjs.org/downloads/range/{start}:{end}/{package}`
- `https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/{package}`
- `https://registry.npmjs.org/-/package/{package}/dist-tags/{tag}`
- `https://registry.npmjs.org/{package}/-/{tarball}.tgz`
- `https://registry.npmjs.org/{package}/{version}`
- `https://registry.npmjs.org/{package}/latest`
- `https://registry.npmjs.org/{package}`

## 注意事项

- 积极使用当前环境的 MCP 来增强 Agent 能力并且减少大模型幻觉
- 代码变更完成之后不要主动执行 dev、build、lint、test 等指令
- 所有代码和文件修改都保留在 Git 工作区，永远不要动暂存区里面的代码和文件

## 语言约束

无论用户使用何种语言提问或表达，必须且只能使用简体中文（Simplified Chinese）进行思考、分析、输出以及调用工具，不要包含任何其他语言的解释。

## 依赖管理

- 项目不使用 `devDependencies`，所有依赖包统一放在 `dependencies` 字段中
- 安装依赖时使用 `pnpm add` 命令，而不是 `pnpm add -D`
