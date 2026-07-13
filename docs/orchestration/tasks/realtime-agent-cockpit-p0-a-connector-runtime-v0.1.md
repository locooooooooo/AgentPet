# realtime-agent-cockpit-p0-a-connector-runtime-v0.1

[长工]#realtime-connector-runtime@v0.1
⟦tag:v2|task|realtime-agent-cockpit-p0-a-connector-runtime-v0.1⟧

loop state: active
dispatch state: active
status: partial_accepted_blocked_safe_foundation
acceptance: partial_accepted
date: 2026-07-13
priority: P0-A

scope note: A1-A5 已交付并通过 PM fixture/full-gate 复核，形成 blocked-safe runtime foundation。生产环境刻意不安装可信授权器，也没有真实 Agent 进程重挂证明，因此不等同于可执行 Connector 或完整实时 E2E。

## objective

实现 blocked-safe 的 Connector runtime 基础设施：run/stop/status/events、Session 生命周期、结构事件、heartbeat/process discovery、timeout/cancel/retry、restart recovery 和审计。当前阶段只用 fixture/项目本地受控进程验证，不执行任何外部 Agent CLI。

## must deliver

1. `AgentInstance`、`ConnectorSession`、`ConnectorEvent` 和 run/stop/status 结果类型。
2. main/preload/Desktop API 的 `connectors:run/stop/status/events` 合同。
3. Adapter 接口与 Codex Adapter 的非执行/fixture 解析实现；最终 command/args/env 只能由 accepted policy + Adapter 生成。
4. Session state machine：starting/running/stopping/completed/failed/cancelled/timed-out/session-lost。
5. heartbeat 和 process liveness；discovery 不得直接产生 online。
6. timeout/cancel/retry：默认 0 retry，分类错误码，退避与预算可审计。
7. restart recovery：能证明则重挂，否则 10 秒内 session-lost。
8. 结构事件的 sequence、eventId 幂等、脱敏、背压边界和订阅清理。
9. blocked-path 测试：未确认/未验收/policy unavailable 时 spawn 次数为 0。

## contract rules

- renderer 不传最终 command/args/env。
- main 从 policy 和 Adapter 解析执行规格，`shell: false`。
- cwd 解析后必须在 workspace root 或明确批准目录内。
- environment 仅保留 allowlist，日志输出前脱敏。
- 一个 Session 恰好一个 started 和一个 terminal event。
- stdout/stderr 只生成 log，不直接决定 success。
- cancel/timeout/recovery 都写 audit event。
- browser fallback 暴露同形合同，但 run 恒 blocked、events 仅 simulation/fixture。

## file fence

allowed:

- `src/types.ts`
- `src/lib/connectorRuntime.ts`
- `electron/main.ts` 的 Connector runtime 独立 hunk
- `electron/preload.ts`
- `src/lib/desktopClient.ts`
- `scripts/check-preload-connector-api.mjs` 仅扩充新 API 的静态 blocked-safe 检查
- `scripts/check-connector-runtime.mjs` 仅新增 Connector runtime 合同/安全验收
- `docs/orchestration/sessions/realtime-agent-cockpit-p0-a-progress-2026-07-13.md`

forbidden:

- `src/lib/agentCore.ts`
- `src/components/**`
- `src/index.css`
- `src/ranch/**`
- `src/components/NiuMaAvatar.tsx`
- `package.json`、上述两项专用脚本之外的 `scripts/**`、`icon/**`
- `docs/orchestration/connectors.json` machine-gate
- `docs/orchestration/status.json` `connectors[]`
- A 范围之外的现有 `electron/main.ts` M5 Day 1 未提交改动

## acceptance

| Check | Required evidence |
| --- | --- |
| API surface | types/preload/main/fallback 对照表与静态检查 |
| blocked path | 10 次 fixture，spawn=0，blocked reason/audit=10 |
| event order | started 唯一、terminal 唯一、sequence 单调、duplicate 幂等 |
| cancel | 1 秒接收，5 秒退出或有升级失败事件 |
| timeout | 到点后 5 秒内 timed-out + cleanup |
| retry | 不可重试错误 0 retry；可重试 fixture 遵循预算/退避 |
| heartbeat | fresh/stale 边界可配置，有 process + heartbeat 两类证据 |
| recovery | 10 秒内 reattached 或 session-lost，无假 running |
| security | shell=false、cwd fence、env allowlist、secret redaction |
| quality | orchestration 四门禁、lint、build、git diff --check |

## failure handling

- 发现 M5 hunk 冲突：停止并在 callback 精确列出冲突，不覆盖用户改动。
- Connector gate 无法证明 blocked-safe：不实现 spawn binding，保留 blocked。
- 子进程不能清理：停止后续 fixture，报告 PID/session 和手工清理证据。
- recovery 无法确定：只允许 session-lost。

## no external execution

禁止运行 `codex`、`trae`、`qoder`、`openclaw`、`claude`、`minimax`、`opencode`。允许的运行证据只能来自项目门禁、纯 fixture 和明确的非 Agent 本地测试进程。

## callback

```text
completed: A1-A5 blocked-safe runtime、heartbeat/retry/recovery/persistence/audit、spawn handshake、双阶段终止、bounded output、publish 前脱敏、eventId/lifecycle 幂等、main trusted-intent fail-closed；fixture 与全门禁通过。
incomplete: production authorizeRun/一次性确认器未安装；无真实 reattachProcess；未执行真实 Agent CLI；未做 P0-C E2E。
blockers: Codex draft/pending/enabled=false；Trae/Qoder placeholder；可信授权与 PID/process-tree 重挂属于后续独立任务。
next action: 保持 machine-gate 与 P0-C standby；由 PM 将 A 作为 blocked-safe foundation 使用，不宣称 execution-ready。
evidence: node scripts/check-connector-runtime.mjs；node scripts/check-preload-connector-api.mjs；npm.cmd run lint/build/orchestration:check/report/preflight/connector-safety；git diff --check；M5 hunks 保留。
```

回调必须区分：已有基线、A 新增 diff、fixture 结果、未验证项。不得 stage/commit/push/reset/clean，不得自报 accepted。
