<h1 align="center">
  <br>
  <a href="https://github.com/thedotmack/claude-mem">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/thedotmack/claude-mem/main/docs/public/claude-mem-logo-for-dark-mode.webp">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/thedotmack/claude-mem/main/docs/public/claude-mem-logo-for-light-mode.webp">
      <img src="https://raw.githubusercontent.com/thedotmack/claude-mem/main/docs/public/claude-mem-logo-for-light-mode.webp" alt="Claude-Mem" width="400">
    </picture>
  </a>
  <br>
</h1>

<p align="center">
  <a href="docs/i18n/README.zh.md">🇨🇳 简体中文</a> •
  <a href="docs/i18n/README.zh-tw.md">🇹🇼 繁體中文</a> •
  <a href="docs/i18n/README.ja.md">🇯🇵 日本語</a> •
  <a href="docs/i18n/README.ko.md">🇰🇷 한국어</a> •
  <a href="docs/i18n/README.es.md">🇪🇸 Español</a> •
  <a href="docs/i18n/README.de.md">🇩🇪 Deutsch</a> •
  <a href="docs/i18n/README.fr.md">🇫🇷 Français</a> •
  <a href="docs/i18n/README.ru.md">🇷🇺 Русский</a> •
  <a href="docs/i18n/README.pt-br.md">🇧🇷 Português</a> •
  <a href="docs/i18n/README.it.md">🇮🇹 Italiano</a>
</p>

<h4 align="center">基于 <a href="https://claude.com/claude-code" target="_blank">Claude Code</a> 构建的持久化记忆压缩系统 — <a href="https://github.com/OCDcreator/claude-mem-fork">自定义 Fork</a></h4>

<p align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-AGPL%203.0-blue.svg" alt="License">
  </a>
  <a href="https://github.com/thedotmack/claude-mem">
    <img src="https://img.shields.io/badge/上游-thedotmack/claude--mem-blue.svg" alt="Upstream">
  </a>
  <a href="package.json">
    <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node">
  </a>
</p>

> **注意**：这是 [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) 的自定义 Fork，由 [OCDcreator](https://github.com/OCDcreator) 维护。它保留上游全部核心功能，并额外加入中文体验、Web UI 改造、Windows 启停稳定性修复和本机排障优化。

---

## 这个 Fork 和原版有什么区别？

如果你只是想快速判断：**原版适合跟随官方上游；这个 Fork 更适合中文使用、Windows 本机长期运行和查看 Web UI 记忆内容。**

| 方向 | 上游 `thedotmack/claude-mem` | 本 Fork `OCDcreator/claude-mem-fork` |
|------|------------------------------|--------------------------------------|
| 核心记忆能力 | 保留 | 完整保留 |
| README | 英文为主，提供多语言文档入口 | 首页 README 改为中文说明，并突出 Fork 安装方式 |
| Web UI 语言 | 原版英文 UI | 增加中英切换，语言偏好保存到本地 |
| Web UI 入口 | 原版导航 | Header 增加上游仓库 / 本 Fork 仓库快捷入口 |
| Web UI 社交入口 | 显示 Discord / X | 隐藏 Discord / X，界面更简洁 |
| 卡片文案 | `Discovery`、`Session Summary` 等英文 | 增加更准确的中文文案，方便直接看记忆列表 |
| 设置面板 | 英文设置项 | 设置弹窗和预览窗口继续补齐中文翻译 |
| 上下文预览 | worker 生成的英文终端风格文本 | 前端 `lang` 透传到 worker，预览内容可输出中文 |
| 日期时间 | 固定英文倾向 | 按当前语言 locale 输出 |
| Worker 启停 | 原版逻辑 | 加固 Windows/macOS 进程枚举、健康检查、端口释放和关闭流程 |
| 固定端口 `37777` | 可能被残留子进程占住 | 修复 `chroma-mcp` 子进程树残留导致的幽灵监听问题 |
| Claude VSCode 启动 | hook 等待 worker 时可能拖到 60 秒超时 | `SessionStart` hook 改为短等待和快速跳过，避免卡住 Claude 启动握手 |
| Hook 端口 | 原版 hook 行为 | hook 运行时读取 `~/.claude-mem/settings.json` 中的 worker 端口 |
| 开发协作 | 上游说明 | 新增 `AGENTS.md` 和 Copilot 指令，记录本 Fork 的构建、测试、架构约束 |

### 本 Fork 主要改动

1. **中文优先的 Web UI**
   - Web 查看器支持 `EN / 中` 切换。
   - 观察记录、会话摘要、设置面板、终端预览等界面补齐中文文案。
   - “发现 / 变更 / 会话摘要”等卡片类型更适合中文阅读。

2. **上下文预览中文化**
   - 设置预览不再只是前端静态翻译。
   - `lang` 会从 Viewer 传到 worker，再由 worker 生成对应语言的上下文文本。
   - 终端风格预览里的图例、列说明、上下文节省提示等都能跟随中文模式。

3. **Windows / macOS 启停稳定性加固**
   - 修复 Windows PowerShell 进程枚举和参数解析问题。
   - 停止 worker 时会清理 SSE 客户端、HTTP socket 和 MCP 子进程。
   - `chroma-mcp`、`uvx`、`uv`、`python` 子进程树会被完整回收，避免 `37777` 被幽灵监听占住。

4. **Claude Code hook 启动防卡死**
   - `SessionStart` 不再长时间等待 worker。
   - worker 异常时 hook 会快速返回，让 Claude Code / Claude VSCode 先正常启动。
   - 修复过 `startup() initialize handshake timed out after 60000ms` 这类启动超时问题。

5. **Fork 开发记录**
   - 所有长期 Fork 改动记录在 [`devlog.md`](devlog.md)。
   - 仓库根目录新增 [`AGENTS.md`](AGENTS.md)，方便后续 AI/代理工具按本 Fork 规则修改。

---

## 安装本 Fork 插件

### 方式一：本地构建 + 同步（推荐）

克隆本仓库后，在项目根目录执行：

```bash
npm install
npm run build-and-sync
```

这会构建全部产物并直接同步到 `~/.claude/plugins/marketplaces/thedotmack/`，同时自动重启 worker 服务。

### 方式二：本地 npx 安装

```bash
npm install
npm run build
npx . install
```

等效于 `npx claude-mem install`，但使用的是你本地 Fork 的代码。

### 方式三：从 GitHub 安装（供其他人使用）

```bash
npx github:OCDcreator/claude-mem-fork install
```

> **注意**：以上方式均会将插件安装到 `~/.claude/plugins/marketplaces/thedotmack/`，会覆盖已安装的原版 claude-mem。安装后重启 Claude Code 即可生效。

---

### 安装原版上游（如果你需要原版）

```bash
npx claude-mem install
```

或在 Claude Code 内：

```bash
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem
```

---

## 核心功能

- 🧠 **持久化记忆** — 上下文跨会话保留
- 📊 **渐进式展示** — 分层记忆检索，带 token 开销可见性
- 🔍 **技能搜索** — 通过 mem-search 技能查询项目历史
- 🖥️ **Web 查看器** — `http://localhost:37777` 实时记忆流
- 🔒 **隐私控制** — 使用 `<private>` 标签排除敏感内容
- ⚙️ **上下文配置** — 细粒度控制注入哪些上下文
- 🤖 **自动运行** — 无需手动干预
- 🌐 **UI 国际化** — Web 查看器支持中英文切换（本 Fork 新增）

---

## 工作原理

**核心组件：**

1. **5 个生命周期钩子** — SessionStart、UserPromptSubmit、PostToolUse、Stop、SessionEnd
2. **Worker 服务** — 端口 37777 上的 HTTP API + Web 查看器，由 Bun 管理
3. **SQLite 数据库** — 存储会话、观察记录、摘要
4. **mem-search 技能** — 自然语言查询，渐进式展示
5. **Chroma 向量数据库** — 语义 + 关键词混合搜索

详见 [架构概览](https://docs.claude-mem.ai/architecture/overview)。

---

## 系统要求

- **Node.js**：18.0.0 或更高版本
- **Claude Code**：支持插件的最新版本
- **Bun**：JavaScript 运行时和进程管理器（缺失时自动安装）
- **uv**：向量搜索所需的 Python 包管理器（缺失时自动安装）
- **SQLite 3**：持久化存储（已内置）

---

## 配置

设置文件位于 `~/.claude-mem/settings.json`（首次运行时自动创建）。

详见 [配置指南](https://docs.claude-mem.ai/configuration)。

### 模式与语言配置

通过 `CLAUDE_MEM_MODE` 设置支持多种工作流模式和语言：

```json
{
  "CLAUDE_MEM_MODE": "code--zh"
}
```

| 模式 | 说明 |
|------|------|
| `code` | 默认英文模式 |
| `code--zh` | 简体中文模式 |
| `code--ja` | 日文模式 |

修改后重启 Claude Code 生效。

---

## 文档

📚 **[查看完整文档](https://docs.claude-mem.ai/)**

- [安装指南](https://docs.claude-mem.ai/installation)
- [使用指南](https://docs.claude-mem.ai/usage/getting-started)
- [搜索工具](https://docs.claude-mem.ai/usage/search-tools)
- [架构概览](https://docs.claude-mem.ai/architecture/overview)
- [开发指南](https://docs.claude-mem.ai/development)
- [故障排除](https://docs.claude-mem.ai/troubleshooting)

---

## 故障排除

遇到问题时，向 Claude 描述问题，排障技能会自动诊断并提供修复方案。

详见 [故障排除指南](https://docs.claude-mem.ai/troubleshooting)。

---

## 构建与开发

```bash
npm install
npm run build
```

详见 [开发指南](https://docs.claude-mem.ai/development)。

---

## 许可证

本项目基于 **GNU Affero General Public License v3.0** (AGPL-3.0) 许可。

Copyright (C) 2025 Alex Newman (@thedotmack). All rights reserved.

详见 [LICENSE](LICENSE) 文件。

---

## 致谢

- **上游项目**：[thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) by Alex Newman
- **本 Fork 维护者**：[OCDcreator](https://github.com/OCDcreator)

---

## 支持

- **文档**：[docs.claude-mem.ai](https://docs.claude-mem.ai/)
- **上游 Issues**：[GitHub Issues](https://github.com/thedotmack/claude-mem/issues)
- **Fork Issues**：[Fork Issues](https://github.com/OCDcreator/claude-mem-fork/issues)
- **官方 X**：[@Claude_Memory](https://x.com/Claude_Memory)
- **官方 Discord**：[加入 Discord](https://discord.com/invite/J4wttp9vDu)
- **上游作者**：Alex Newman ([@thedotmack](https://github.com/thedotmack))

---

**Built with Claude Agent SDK** | **Powered by Claude Code** | **Made with TypeScript**
