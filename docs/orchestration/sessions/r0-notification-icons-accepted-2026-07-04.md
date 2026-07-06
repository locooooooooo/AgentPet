[短工]#r0-notification-icons-accepted@2026-07-04

⟦tag:v2|session|r0-notification-icons-accepted-2026-07-04⟧
⟦tag:v2|task|ranch-real-integration-p0-v0.1⟧

loop state: summarized
dispatch state: summarized

date: 2026-07-04
source request: `C0-6 -> cockpit P0 accepted -> R0-4 -> R0-5 -> 最后再决策 R0-3 connector`
task card: `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`

objective:
- Close R0-4 by wiring agent-specific system notification icons with a safe fallback.

scope guard:
- No external connector was enabled, bound, or executed.
- No `approvalStatus` was changed to `accepted`.
- No `enabledByDefault` was changed to `true`.
- Existing `icon/` assets were reused; no icon file was edited.

implementation:
- `src/types.ts` adds optional `agentId` to `AgentSystemMessage` and `RanchNotifyPayload`.
- `src/lib/agentCore.ts` preserves `agentId` through normalized messages and exports `appendSystemMessage()`.
- `electron/main.ts` publishes success/error completion messages for local tasks with the task owner `agentId`.
- `src/ranch/hooks/useRanchNotifications.ts` forwards `latestMessage.agentId` into `api.ranch.requestSystemNotify()`.
- `electron/main.ts` resolves `icon/<agent>.png|jpg|jpeg` and handles current aliases `OpenClaw.jpeg` and `OpenCode .jpeg`; missing/invalid icons fall back to the default Electron notification icon.

acceptance result:
- R0-4 accepted.

completed:
- Direct notification request returned `true` for `codex` standard icon.
- Direct notification request returned `true` for `openclaw` alias icon.
- Direct notification request returned `true` for `openccode` alias icon.
- Direct notification request returned `true` for missing-agent fallback.
- Local success task emitted latest system message `type=success`, `agentId=codex` in `88ms`.
- Local failure task emitted latest system message `type=error`, `agentId=trae` in `78ms`.

incomplete:
- Direct Windows toast artwork cannot be programmatically inspected from CDP, so icon display is proven by code path, existing assets, nativeImage non-empty fallback handling, and successful Electron notification requests.

blockers:
- None for R0-4.

next action:
- Treat R0-4 as accepted.

evidence:
- Runtime evidence source: Electron CDP on rebuilt `dist/index.html` and `dist/ranch.html`.
- CDP result: `notifyDirect.codexIcon=true`, `openclawAlias=true`, `openccodeAlias=true`, `fallbackMissing=true`.
- CDP result: success latest message `任务已完成`, `agentId=codex`; error latest message `任务失败`, `agentId=trae`.
