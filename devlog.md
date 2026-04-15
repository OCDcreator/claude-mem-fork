# claude-mem-fork Dev Log

更新日期：2026-04-16

## 对比范围

- 上游仓库：`thedotmack/claude-mem`
- 上游当前 HEAD：`4ddf57610abb731ad53109b3aa3f957445ee13fb`
- Fork 与上游的共同基线：`1d7500604fe55cbde57875cb40e2cd431b1de2b3`
- 本日志记录 `1d750060..HEAD` 之间，本 Fork 相对上游的长期改动

## Fork 提交序列

- `eb20a306` `feat(ui): add i18n language toggle and repo link buttons to header`
- `3eeb5b99` `docs: 重写 README 为中文，添加 Fork 改动说明`
- `18bfdf84` `docs: README 添加 Fork 本地安装说明`
- `6fd145b6` `feat(fork): localize viewer and harden worker startup`
- `e07190ca` `feat(fork): polish viewer copy and harden worker shutdown`
- `7e48cfd5` `chore: add Windows network diagnostics files to gitignore`
- `84a4ed5f` `fix(worker): kill chroma subprocess tree on shutdown`
- `10044ec3` `fix(worker): avoid sessionstart handshake stalls`
- `88be18d4` `docs(dev): add fork agent instructions`

## 变更主题

### 1. Viewer Header 与基础中英切换

- Viewer Header 增加中英切换按钮。
- 增加上游仓库与 Fork 仓库入口按钮。
- 引入 `I18nContext`，为 Viewer UI 提供基础双语能力。

涉及文件：

- `src/ui/viewer/components/Header.tsx`
- `src/ui/viewer/context/I18nContext.tsx`
- `src/ui/viewer/App.tsx`
- `src/ui/viewer/index.tsx`
- `src/ui/viewer-template.html`
- `plugin/ui/viewer.html`
- `plugin/ui/viewer-bundle.js`

### 2. README 中文化与 Fork 安装说明

- README 改为中文说明，明确这是自定义 Fork。
- 补充 Fork 相对上游的改动说明。
- 补充本地构建、同步安装、GitHub 安装等使用方式。
- 同步插件元数据中的仓库信息。

涉及文件：

- `README.md`
- `.claude-plugin/plugin.json`
- `.codex-plugin/plugin.json`

### 3. 上下文预览与设置面板汉化

- `lang` 参数从前端一直透传到 worker 端上下文渲染链路。
- Header / Timeline / Summary / Footer / HumanFormatter 全链路支持中文输出。
- 设置面板、终端预览、卡片文案补齐中文翻译。
- 日期时间按 locale 输出，而不是固定英文格式。
- Header 中 Discord / X 入口已隐藏。

涉及文件：

- `src/ui/viewer/components/ContextSettingsModal.tsx`
- `src/ui/viewer/components/Header.tsx`
- `src/ui/viewer/components/ObservationCard.tsx`
- `src/ui/viewer/components/PromptCard.tsx`
- `src/ui/viewer/components/SummaryCard.tsx`
- `src/ui/viewer/components/TerminalPreview.tsx`
- `src/ui/viewer/context/I18nContext.tsx`
- `src/ui/viewer/hooks/useContextPreview.ts`
- `src/services/worker/http/routes/SearchRoutes.ts`
- `src/services/worker/http/routes/ViewerRoutes.ts`
- `src/services/context/ContextBuilder.ts`
- `src/services/context/formatters/HumanFormatter.ts`
- `src/services/context/sections/HeaderRenderer.ts`
- `src/services/context/sections/TimelineRenderer.ts`
- `src/services/context/sections/SummaryRenderer.ts`
- `src/services/context/sections/FooterRenderer.ts`
- `src/services/context/types.ts`
- `src/shared/timeline-formatting.ts`
- `plugin/ui/viewer-bundle.js`
- `plugin/ui/viewer.html`
- `plugin/scripts/context-generator.cjs`
- `plugin/scripts/worker-service.cjs`

### 4. Worker 启停稳定性与 Windows 兼容修复

- 修复 Windows 下进程清理与启动相关逻辑，减少僵尸进程和端口残留。
- 健康检查、端口释放等待、SSE 连接收尾、HTTP socket 销毁等链路已加固。
- `SessionStart` hook 改为更短等待与快速跳过策略，避免把 Claude VSCode 的启动握手拖到 60 秒超时。
- Windows daemon 启动增加 fallback：`Start-Process` 失败时退回 `spawn(..., detached)`。

涉及文件：

- `src/services/infrastructure/ProcessManager.ts`
- `src/services/infrastructure/HealthMonitor.ts`
- `src/services/infrastructure/GracefulShutdown.ts`
- `src/services/worker-spawner.ts`
- `src/services/worker-service.ts`
- `src/services/server/Server.ts`
- `src/shared/worker-utils.ts`
- `src/services/worker/SSEBroadcaster.ts`
- `plugin/hooks/hooks.json`
- `plugin/scripts/worker-service.cjs`
- `plugin/scripts/mcp-server.cjs`

### 5. Chroma MCP 关闭链路彻底清理

- 识别到 `37777` 幽灵监听的根因是 `chroma-mcp` 子进程树未被正确回收。
- 停止 worker 时先抓取完整 descendant tree，再等待退出。
- 若优雅关闭失败，则强制终止残余 `uvx / uv / chroma-mcp / python` 进程树。
- 仅在确认退出后才清理 supervisor 记录，避免假清理。

涉及文件：

- `src/services/sync/ChromaMcpManager.ts`
- `src/services/infrastructure/ProcessManager.ts`
- `src/services/infrastructure/GracefulShutdown.ts`
- `plugin/scripts/worker-service.cjs`
- `plugin/scripts/mcp-server.cjs`
- `tests/services/sync/chroma-mcp-manager-stop.test.ts`
- `tests/infrastructure/graceful-shutdown.test.ts`
- `tests/infrastructure/health-monitor.test.ts`
- `tests/infrastructure/process-manager.test.ts`
- `tests/shared/worker-utils.test.ts`
- `tests/worker/sse-broadcaster.test.ts`

### 6. Hook 与端口配置行为调整

- Hook 健康检查不再依赖写死端口，而是运行时读取 `settings.json` 中的 `CLAUDE_MEM_WORKER_PORT`。
- `SessionStart` 的启动 hook 现在只负责短时间探活，不再长时间阻塞。
- context hook 仅在 worker 已健康时注入上下文，避免启动期误报。

涉及文件：

- `plugin/hooks/hooks.json`
- `src/shared/worker-utils.ts`
- `src/services/infrastructure/HealthMonitor.ts`
- `plugin/scripts/worker-service.cjs`

### 7. 仓库开发说明补充

- 新增仓库根 `AGENTS.md`，约束构建、测试、架构与编译产物编辑规则。
- 更新 `.github/copilot-instructions.md`，补充本 Fork 的开发与架构说明，方便 AI/代理工具在仓库内工作。

涉及文件：

- `AGENTS.md`
- `.github/copilot-instructions.md`

### 8. 其他 Fork 维护项

- 将 Windows 抓包/网络诊断导出文件加入 `.gitignore`。

涉及文件：

- `.gitignore`

## 验证结论

- 当前 Fork 已验证通过的关键方向：
  - Viewer 中英切换与中文文案渲染
  - 设置预览的 `lang` 透传与中文上下文输出
  - Windows / macOS 双端进程枚举兼容
  - `37777` 固定端口下的 worker 启停闭环
  - `chroma-mcp` 子进程树清理
  - `SessionStart` hook 冷启动不再拖垮 Claude VSCode 启动握手

- 代表性验证包括：
  - `bun test tests/infrastructure/process-manager.test.ts tests/services/sync/chroma-mcp-manager-stop.test.ts tests/infrastructure/graceful-shutdown.test.ts tests/infrastructure/health-monitor.test.ts tests/worker/sse-broadcaster.test.ts`
  - `node scripts/build-hooks.js`

## 维护约定

- 修改 `src/` 后，必须重新执行 `npm run build` 或 `node scripts/build-hooks.js`，同步生成：
  - `plugin/scripts/*.cjs`
  - `plugin/ui/viewer-bundle.js`
  - `plugin/ui/viewer.html`
- 不直接手改编译产物；仓库中的产物差异应来自源码变更后的重新构建。
