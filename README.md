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

> **注意**：这是 [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) 的自定义 Fork，由 [OCDcreator](https://github.com/OCDcreator) 维护。除上游全部功能外，本仓库增加了额外的 Web UI 增强功能。

---

## 本 Fork 相对上游的改动

### 1. Web UI Header 国际化与仓库快捷按钮

在 Web 查看器（`http://localhost:37777`）的 header 右上角新增了三个按钮：

| 按钮 | 说明 |
|------|------|
| **语言切换** (`EN` / `中`) | 在中英文之间切换 UI 文本，语言偏好通过 `localStorage` 持久保存 |
| **Upstream** (蓝色药丸) | 新标签页打开上游仓库 [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) |
| **My Fork** (绿色药丸) | 新标签页打开本 Fork 仓库 [OCDcreator/claude-mem-fork](https://github.com/OCDcreator/claude-mem-fork) |

**实现细节：**

- 新增 `I18nContext` React Context，提供 `lang`、`toggleLang()`、`t()` 接口
- 翻译键覆盖 header 内所有 title 和文本（文档、X、Discord、设置、控制台等）
- 暗色终端风格：绿色边框语言按钮 + 蓝/绿药丸形仓库链接
- Hover 效果：颜色反转 + 1px 上浮动画
- 响应式：≤768px 时仓库链接文字折叠为纯图标；≤600px 时进一步紧凑

**涉及的文件变更：**

| 文件 | 变更 |
|------|------|
| `src/ui/viewer/context/I18nContext.tsx` | 新增 — 国际化 Context Provider |
| `src/ui/viewer/components/Header.tsx` | 修改 — 添加三个按钮 + i18n |
| `src/ui/viewer/App.tsx` | 修改 — 引入 `useI18n` |
| `src/ui/viewer/index.tsx` | 修改 — 包裹 `<I18nProvider>` |
| `src/ui/viewer-template.html` | 修改 — 新增 CSS 样式 + 响应式规则 |

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
