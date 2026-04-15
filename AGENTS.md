# AGENTS.md

## Build & Dev

```bash
npm run build              # Build all targets (hooks, worker, MCP server, viewer, NPX CLI)
npm run build-and-sync     # Build + sync to ~/.claude/plugins/marketplaces/thedotmack/ + restart worker
```

The build uses esbuild (`scripts/build-hooks.js`) to bundle TypeScript source from `src/` into CJS outputs in `plugin/scripts/`. Never edit files in `plugin/scripts/` directly — they are compiled outputs.

## Test

```bash
bun test                          # Run all tests
bun test tests/sqlite/            # SQLite-specific tests
bun test tests/worker/agents/     # Agent tests
bun test tests/worker/search/     # Search tests
bun test tests/context/           # Context injection tests
bun test tests/infrastructure/    # Infra tests
bun test tests/server/            # Server tests
```

Tests run via Bun (`bunfig.toml` uses `smol = true` to isolate each file in its own worker). There is no separate lint or typecheck command configured.

## Architecture

- **Source**: `src/` (TypeScript ESM) → built to `plugin/scripts/*.cjs` and `dist/`
- **Hooks**: 5 lifecycle hooks defined in `plugin/hooks/hooks.json` (Setup, SessionStart, UserPromptSubmit, PostToolUse, PreToolUse, Stop, SessionEnd)
- **Worker**: Express API on port 37777, runs via Bun (`plugin/scripts/worker-service.cjs`). Entrypoint: `src/services/worker-service.ts`
- **MCP Server**: Node.js-based (`plugin/scripts/mcp-server.cjs`). Entrypoint: `src/servers/mcp-server.ts`. **Must not import anything that touches `bun:sqlite`** — see guardrails in `scripts/build-hooks.js`
- **Context Generator**: `plugin/scripts/context-generator.cjs`. Entrypoint: `src/services/context-generator.ts`
- **NPX CLI**: `dist/npx-cli/index.js`. Entrypoint: `src/npx-cli/index.ts`
- **Viewer UI**: React app built to `plugin/ui/viewer.html`. Source in `src/ui/viewer/`
- **Skills**: `plugin/skills/` (mem-search, make-plan, do, smart-explore, etc.) — source Markdown, not compiled
- **Database**: SQLite3 at `~/.claude-mem/claude-mem.db` (uses `bun:sqlite` in worker)
- **Chroma**: Vector embeddings at `~/.claude-mem/chroma/`

## Key Conventions

- **Never edit compiled output** in `plugin/scripts/`, `dist/`, or `plugin/ui/` — edit source in `src/` and rebuild
- **Exit codes**: Hooks use exit 0 for all errors (prevents Windows Terminal tab accumulation). Exit 1 = non-blocking warning, exit 2 = blocking error fed to Claude
- **Worker runtime is Bun**; MCP server runtime is Node. Do not cross `bun:sqlite` imports into MCP server code
- **MCP server has a 600KB bundle size budget** — if the build exceeds it, a transitive import likely pulled in worker-service code
- **Changelog is auto-generated** — never edit `CHANGELOG.md`
- **Settings**: `~/.claude-mem/settings.json` (auto-created with defaults)
- **Privacy**: `<private>content</private>` tags strip content at the hook layer before storage

## File Locations (runtime)

- Installed plugin: `~/.claude/plugins/marketplaces/thedotmack/`
- Logs: `~/.claude-mem/logs/worker-YYYY-MM-DD.log`
- Config: `~/.claude-mem/settings.json`
- DB: `~/.claude-mem/claude-mem.db`

## Installation Methods

1. `npm run build-and-sync` — local dev, syncs directly to marketplace dir
2. `npm run build && npx . install` — local npx-based install
3. `npx github:user/repo install` — from GitHub

## Fork DevLog (`devlog.md`)

`devlog.md` 记录本 Fork 相对上游 `thedotmack/claude-mem` 的所有改动。当前已完成的改动：

- **Viewer UI 中英切换**: Header 语言切换按钮、`I18nContext`、上游/Fork 仓库入口
- **文档本地化**: README 重写为中文、补充 Fork 安装说明
- **上下文预览 i18n**: `lang` 参数从前端贯穿到 worker 渲染链路（HeaderRenderer / TimelineRenderer / SummaryRenderer / FooterRenderer / HumanFormatter），日期时间按 locale 输出
- **设置面板汉化**: ContextSettingsModal、TerminalPreview 接入 i18n
- **社交入口隐藏**: Header 中 Discord / X 入口已隐藏
- **Windows ProcessManager 修复**: orphan cleanup 的 PowerShell 调用从字符串拼接改为 `execFile()` 参数化调用，修复 WQL 引号解析错误
- **Hook 动态端口**: `hooks.json` 健康检查端口改为运行时从 `settings.json` 读取 `CLAUDE_MEM_WORKER_PORT`

修改 Fork UI 或 worker 后，必须 `npm run build` 重新生成 `plugin/ui/viewer-bundle.js` 和 `plugin/scripts/*.cjs`。
