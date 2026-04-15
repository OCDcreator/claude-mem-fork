# claude-mem Development Instructions

> **claude-mem** — Persistent memory compression plugin for Claude Code. This is a custom fork of [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) with Web UI i18n enhancements.

## Quick Start

```bash
npm install                  # Install dependencies
npm run build-and-sync       # Build all artifacts, sync to marketplace, restart worker
npm test                     # Run all tests (Bun test runner)
```

## Build System

- **Runtime**: Bun (auto-installed if missing). Requires Node.js >=18 and Bun >=1.0.
- **Build pipeline**: `npm run build` runs `sync-plugin-manifests.js` then `build-hooks.js`
- **esbuild** bundles 3 targets: `worker-service.cjs`, `mcp-server.cjs`, `context-generator.cjs` -> `plugin/scripts/`
- **Viewer UI**: React app built by `scripts/build-viewer.js` -> `plugin/ui/viewer.html`
- **TypeScript**: Strict mode, ES2022 target, ESNext modules. Output to `dist/` (library), `plugin/scripts/` (plugin)

### Key Build Scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Build hooks + sync manifests |
| `npm run build-and-sync` | Build -> sync to `~/.claude/plugins/marketplaces/thedotmack/` -> restart worker |
| `npm run sync-marketplace` | Copy plugin to installed location |
| `npm run worker:start\|stop\|restart` | Manage the worker daemon via Bun |
| `npm run worker:logs` | Tail today's worker log |
| `npm run queue` | Check pending message queue |

## Architecture

### 5-Lifecycle Hook System
Claude Code triggers hooks at: **SessionStart -> UserPromptSubmit -> PostToolUse -> Summary -> SessionEnd**

Hooks are defined in `plugin/hooks/hooks.json`. Each hook calls a built script in `plugin/scripts/`.

### Worker Service
- Express HTTP server on **port 37777** (configurable via `CLAUDE_MEM_WORKER_PORT`)
- Entry point: `src/services/worker-service.ts` -> orchestrates specialized modules
- Routes: Session, Data, Search, Settings, Memory, Corpus, Logs, Viewer
- Real-time updates via SSE (`SSEBroadcaster`)

### Dual Session ID System
- `contentSessionId` -- Claude Code conversation ID (invariant)
- `memorySessionId` -- SDK agent session ID (changes on restart)
- **NEVER** use `contentSessionId` for SDK resume; always use `memorySessionId`

### Key Source Directories

| Directory | Purpose |
|-----------|---------|
| `src/hooks/` | Hook response standardization |
| `src/cli/` | Hook command orchestrator + handlers + platform adapters |
| `src/services/worker/` | Business logic (SDKAgent, SessionManager, SearchManager) |
| `src/services/sqlite/` | SQLite persistence (sessions, observations, summaries, timeline) |
| `src/services/sync/` | ChromaDB vector embedding sync |
| `src/services/infrastructure/` | Process management, health monitoring, graceful shutdown |
| `src/services/context/` | Context generator and semantic injection |
| `src/services/domain/` | Mode management (i18n locale inheritance) |
| `src/services/integrations/` | IDE hooks (Cursor, Windsurf, Gemini CLI, etc.) |
| `src/supervisor/` | Daemon lifecycle, PID management, signal handlers |
| `src/sdk/` | SDK exports for external consumers |
| `src/servers/` | MCP server implementation |
| `src/shared/` | Settings manager, env manager, hook constants, paths |
| `src/ui/viewer/` | React viewer UI components |
| `src/utils/` | Tag stripping, logging, transcript parsing |

### Plugin Structure (`plugin/`)
The installable plugin lives in `plugin/`:
- `hooks/hooks.json` -- Lifecycle hook definitions
- `scripts/*.cjs` -- Built hook scripts (worker-service, mcp-server, context-generator)
- `skills/` -- 7 skills (mem-search, make-plan, do, knowledge-agent, etc.)
- `modes/` -- 35+ localized mode profiles
- `ui/viewer.html` -- Built React viewer

## Testing

- **Framework**: Bun native test runner (`bun:test`)
- **Config**: `bunfig.toml` sets `smol = true` (isolated worker per test file, prevents `mock.module()` leakage)
- **Test locations**: `tests/` with subdirectories: `sqlite/`, `worker/`, `services/`, `context/`, `infrastructure/`, `hooks/`, `utils/`
- **In-memory SQLite**: Tests use `:memory:` databases for isolation
- **Commands**:
  - `npm test` -- All tests
  - `npm run test:sqlite` -- SQLite layer
  - `npm run test:agents` -- Agent tests
  - `npm run test:search` -- Search functionality

## Development Conventions

### Exit Code Strategy
Hooks use specific exit codes per Claude Code's contract:
- **Exit 0**: Success or graceful failure (worker unavailable, timeouts, HTTP 5xx)
- **Exit 1**: Non-blocking error (stderr shown to user, continues)
- **Exit 2**: Blocking error (stderr fed to Claude, HTTP 4xx, programming errors)

### Privacy Tags
- `<private>content</private>` -- User-level privacy, prevents storage
- Tag stripping at hook layer before data reaches worker/database (`src/utils/tag-stripping.ts`)

### Configuration
- Settings: `~/.claude-mem/settings.json` (auto-created with defaults)
- Env priority: `~/.claude-mem/.env` > `settings.json` > `SettingsDefaultsManager.DEFAULTS`
- Provider routing: Claude (default), Gemini, OpenRouter

### Database
- SQLite3 at `~/.claude-mem/claude-mem.db`
- Migrations in `src/services/sqlite/migrations/`
- Key tables: `sdk_sessions`, `observations`, `session_summaries`

### Fork-Specific: Web UI i18n
- `I18nContext` React context provides `lang`, `toggleLang()`, `t()` for viewer header
- Header buttons: language toggle (EN/中), upstream link (blue pill), fork link (green pill)
- Responsive breakpoints: <=768px collapses text, <=600px further compact
- Files: `src/ui/viewer/context/I18nContext.tsx`, `src/ui/viewer/components/Header.tsx`

## Common Patterns

### Adding a New Route
1. Create route file in `src/services/worker/http/routes/`
2. Register in route loader (`src/services/worker/http/`)
3. Add endpoint to `src/services/server/allowed-constants.ts`

### Adding a New Service Module
1. Create in `src/services/worker/` or appropriate subdirectory
2. Wire into `WorkerService` class in `src/services/worker-service.ts`
3. Add tests in `tests/`

### Adding a New IDE Integration
1. Create installer in `src/services/integrations/` (follow `CursorHooksInstaller.ts` pattern)
2. Register in CLI commands (`src/npx-cli/`)

## Important Notes

- Never edit `CHANGELOG.md` -- it's auto-generated
- Never edit `plugin/package.json` directly -- it's auto-generated by build
- Worker logs: `~/.claude-mem/logs/worker-YYYY-MM-DD.log`
- Docs source: `docs/public/` (MDX), auto-deploys on push to main
