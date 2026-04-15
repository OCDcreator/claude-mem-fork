# claude-mem-fork Dev Log

更新日期：2026-04-15

## 对比基线

- 上游仓库：`thedotmack/claude-mem`
- 对比基线 commit：`1d7500604fe55cbde57875cb40e2cd431b1de2b3`
- 当前 Fork 相对该基线的已提交 commit：
  - `eb20a306` `feat(ui): add i18n language toggle and repo link buttons to header`
  - `3eeb5b99` `docs: 重写 README 为中文，添加 Fork 改动说明`
  - `18bfdf84` `docs: README 添加 Fork 本地安装说明`

## 已提交的 Fork 改动

### 1. Web Viewer 头部增强与中英切换

- 在 Viewer Header 中加入语言切换按钮。
- 增加上游仓库与个人 Fork 仓库快捷入口。
- 引入 `I18nContext`，为 Header 与相关 UI 文案提供中英文切换能力。
- 更新 `App.tsx`、`index.tsx`、`viewer-template.html` 与 `viewer-bundle.js`，让新 UI 与构建产物保持一致。

涉及文件：

- `src/ui/viewer/components/Header.tsx`
- `src/ui/viewer/context/I18nContext.tsx`
- `src/ui/viewer/App.tsx`
- `src/ui/viewer/index.tsx`
- `src/ui/viewer-template.html`
- `plugin/ui/viewer.html`
- `plugin/ui/viewer-bundle.js`

### 2. 文档本地化与 Fork 安装说明

- README 重写为中文说明，明确这是一个自定义 Fork。
- README 中补充相对上游的改动说明。
- README 中补充本地构建、同步安装、GitHub 安装等使用方式。
- 同步更新 `.claude-plugin/plugin.json` 与 `.codex-plugin/plugin.json` 中的插件元数据指向。

涉及文件：

- `README.md`
- `.claude-plugin/plugin.json`
- `.codex-plugin/plugin.json`

### 3. 插件运行脚本与构建产物同步

- Fork 中的运行脚本与打包产物已同步更新，确保 Viewer/UI 改动能够在插件安装后直接生效。
- 当前相对上游的 diff 中包含 `context-generator.cjs`、`mcp-server.cjs`、`worker-service.cjs` 等生成物或运行脚本差异，属于 Fork 当前发布内容的一部分。

涉及文件：

- `plugin/scripts/context-generator.cjs`
- `plugin/scripts/mcp-server.cjs`
- `plugin/scripts/worker-service.cjs`

## 当前未提交的本地改动

截至今天，工作区还有以下未提交内容：

- `src/ui/viewer/components/Header.tsx`
  - 隐藏了 Discord 与 X 相关入口。
- `src/ui/viewer/context/I18nContext.tsx`
  - 扩充了设置面板与预览窗口相关翻译词条。
  - 增加语言初始化迁移逻辑，兼容旧版本遗留的英文默认值。
- `src/ui/viewer/components/ContextSettingsModal.tsx`
  - 将设置弹窗中此前未汉化的标题、选项、提示文案和占位符继续接入 i18n。
- `src/ui/viewer/components/TerminalPreview.tsx`
  - 将预览窗口自身的 `Wrap`、`Scroll`、`Loading preview...` 一并接入 i18n。
- `src/ui/viewer/hooks/useContextPreview.ts`
  - 为设置预览接口追加 `lang` 参数，让左侧预览内容也能跟随中英文切换。
- `src/services/worker/http/routes/SearchRoutes.ts`
  - 设置预览接口向后端上下文生成器透传 `lang`。
- `src/services/context/types.ts`
  - 为上下文生成输入新增 `lang` 字段。
- `src/services/context/ContextBuilder.ts`
  - 将 `lang` 与 locale 贯穿到 header、timeline、summary、footer、empty state 的渲染链路。
- `src/services/context/formatters/HumanFormatter.ts`
  - 将设置预览左侧“终端风格上下文预览”中的固定英文文案抽成中英双语文案。
  - 包括 `recent context`、`Legend`、`Column Key`、`Context Economics`、`Previously` 等。
- `src/services/context/sections/HeaderRenderer.ts`
- `src/services/context/sections/FooterRenderer.ts`
- `src/services/context/sections/SummaryRenderer.ts`
- `src/services/context/sections/TimelineRenderer.ts`
  - 将 `lang` / locale 贯穿到各分段渲染器。
  - 使日期、时间与 summary 时间显示在中文模式下使用中文本地化格式。
- `src/shared/timeline-formatting.ts`
  - 补充按 locale 输出日期/时间的格式化函数。
- `src/services/infrastructure/ProcessManager.ts`
  - 修复 Windows 下 worker 启动时“孤儿进程枚举/清理”命令的 PowerShell/WQL 引号拼接问题。
  - 改为 `execFile(powershell, args[])` 执行，避免字符串拼接造成的参数解析错误。
- `plugin/ui/viewer-bundle.js`
  - 与上述前端改动对应的最新打包产物。
- `plugin/scripts/context-generator.cjs`
- `plugin/scripts/mcp-server.cjs`
- `plugin/scripts/worker-service.cjs`
  - 与上述上下文预览多语言、Windows 进程清理修复对应的最新构建产物。
- `plugin/hooks/hooks.json`
  - 将 SessionStart 阶段的健康检查端口从写死的 `37777` 改为运行时读取 `~/.claude-mem/settings.json` 中的 `CLAUDE_MEM_WORKER_PORT`。
  - 避免仓库源码在重新安装插件时覆盖掉本机已修复的动态端口行为。

## 这轮问题定位结论

这次排查并不是单纯的“设置面板漏翻译”，而是两个链路叠加：

- 前端设置面板本身存在未接入 i18n 的文案。
- 左侧上下文预览并不是前端静态文本，而是 worker 端实时生成的终端风格上下文摘要，因此也需要单独接入语言参数。

另外，在本机 Windows 环境中还暴露出一个更底层的稳定性问题：

- worker 启动时的 orphan cleanup / aggressive startup cleanup 在 Windows 上使用了手拼的 PowerShell 命令。
- 该命令中的 WQL `-Filter` 引号嵌套会在某些情况下解析失败。
- 日志中可稳定复现：
  - `Failed to enumerate orphaned processes during aggressive cleanup`
  - `Get-CimInstance ... A positional parameter cannot be found ...`
- 这个问题会导致旧 worker / chroma / mcp 残留状态无法被正确清理，进而诱发端口仍在监听、重启异常、Web UI 健康检查超时等现象。

## 跨平台兼容性说明

这次修复不是“只适配 Windows”，而是按平台分支收敛问题：

- macOS / Linux 既有逻辑保留不变：
  - orphan cleanup 仍使用 Unix 分支的 `ps -eo pid,etime,command`。
  - kill 路径仍使用 `process.kill(...)`。
  - Bun daemon 的 Unix/macOS `spawn` / `setsid` 路径未被改动。
- Windows 分支单独修复：
  - 只把 PowerShell 调用从手拼 shell 字符串改为 `execFile()` 参数化调用。
  - 修的是 Windows 引号与参数解析问题，不会影响 macOS/Unix 现有流程。
- Hook 端口读取改为跨平台的 Node 读取配置文件：
  - `plugin/hooks/hooks.json` 不再写死端口。
  - 继续通过 POSIX shell 执行，但端口值由 Node 从 `settings.json` 读取，因此对 macOS 与 Windows 上的安装配置都能保持一致。
- 上下文预览国际化为通用改动：
  - `lang` 由前端传到 worker，再由 worker 渲染不同语言。
  - 这条链路对 Windows 和 macOS 都适用。
  - 日期/时间改为 locale 感知输出，不依赖单一平台。

## 今天的本地安装修复记录

这部分改动主要发生在本机安装目录，不属于仓库内源码提交，但需要记录：

- 已修复本机 Claude Code 安装版 `claude-mem` 的 `hooks.json`。
  - 之前 hook 健康检查写死为 `37777`。
  - 现已改为从 `~/.claude-mem/settings.json` 动态读取 `CLAUDE_MEM_WORKER_PORT`。
- 排障过程中临时切换过本机 worker 端口，用于绕开已损坏的历史监听状态。
- 但最终定位结论是：
  - “反复换端口”不是根治方案。
  - 根因是 Windows 下 worker 启动时的 orphan cleanup PowerShell/WQL 引号拼接错误。
- 已清理卡住的 `start/stop` 残留进程并重建 `supervisor.json` 状态。
- 已将修复后的 `viewer-bundle.js`、`worker-service.cjs`、`context-generator.cjs` 同步到本机 Claude Code 安装目录进行验证。
- 在修复后的版本上，设置预览接口已能返回中文内容，例如：
  - `近期上下文`
  - `图例`
  - `列说明`
  - `上下文经济性`

## 备注

- 如果后续继续修改 Viewer UI，记得同步更新 `plugin/ui/viewer-bundle.js`。
- 如果打算把今天的设置面板汉化、社交入口隐藏、预览区多语言与 Windows 启动修复正式纳入 Fork，建议拆成至少两个 commit：
  - 一个用于 UI / i18n。
  - 一个用于 worker / ProcessManager 稳定性修复。
- 本机目前观察到的“幽灵监听 PID”更像是这次修复前历史残留的 Windows 状态；修复后的代码应能避免继续制造同类问题，但已经坏掉的本机状态仍可能需要完全退出 Claude Code，必要时重启系统后再验证。
