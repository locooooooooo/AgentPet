# realtime-agent-cockpit-v0.1

[PM]#realtime-agent-cockpit@v0.1
⟦tag:v2|task|realtime-agent-cockpit-v0.1⟧

loop state: active
dispatch state: active
status: partial_acceptance_waiting_electron_e2e
control lane: standby_control
date: 2026-07-13

## objective

把当前约 35% 的“真实多 Agent 实时控制舱”推进到可验收的单 Codex P0，不把种子工位、静态编排状态、CLI 可发现或模拟 tick 误报为在线 Agent。

## source

- `docs/实时Agent控制舱需求与实施路线-v0.1-2026-07-13.md`
- `docs/orchestration/status.json`
- `docs/orchestration/connectors.json`
- `docs/orchestration/tasks/realtime-agent-cockpit-p0-a-connector-runtime-v0.1.md`
- `docs/orchestration/tasks/realtime-agent-cockpit-p0-b-data-truth-v0.1.md`
- `docs/orchestration/tasks/realtime-agent-cockpit-p0-c-codex-acceptance-v0.1.md`

## current truth

- 本地命令执行看板约 75%；真实多 Agent 实时控制舱暂记约 60%：blocked-safe runtime foundation、AgentInstance selector、renderer truth 和 SSR DOM state matrix 已落地，但没有真实 Electron session E2E、可信授权器或生产重挂证明。
- 当前只定义 Codex/Trae/Qoder 三个 Connector，三者全部 blocked/non-executable。
- Codex 是 draft/pending/discovery-only；Trae/Qoder 是 intentionally command-empty placeholders。
- 进入本轮前的本机发现快照：codex/openclaw/claude/minimax 可发现；trae/qoder/opencode 未发现。
- `ConnectorRuntimeSnapshot` 已通过 main/preload/Desktop API 暴露 run/stop/snapshot/audit 合同；renderer 仍受 machine-gate 与主进程 trusted intent 保护。
- 浏览器 fallback 的 runtime envelope 明确为 `unavailable + simulated + browser-fallback`，不是真实 Agent 运行；renderer freshness 由 selector fixture 和 1 秒 tick 驱动。
- 本卡和子卡创建不改变 connector approval/enabled/command，也不授权外部 CLI。

## work split

| card | owner | current state | scope |
| --- | --- | --- | --- |
| P0-A | `[长工]#realtime-connector-runtime@v0.1` | partial_accepted_blocked_safe_foundation | A1-A5 runtime/fixture/full-gate 通过；production authorizer、真实 reattach 和外部 E2E 未启用 |
| P0-B | `[长工]#realtime-truth-ui@v0.1` | partial_accepted_renderer_truth_slice | selector + App/Home/Cockpit 接线、fallback 1280/1440/1920 浏览器复核、fresh/stale/lost SSR fixture 和 Electron event p95 通过；真实 E2E 待补 |
| P0-C | `[长工]#realtime-requirements-control@v0.1` + PM | standby / authorization_required | Codex controlled dry-run 与 E2E acceptance；当前不得执行 |

主 control lane 保持 `standby_control`：它只协调 A/B 合同和 C 验收。A/B 的 partial accepted 只代表受限切片已被 PM 验收，不代表 Connector runtime 已可执行。

## dependency order

1. C 冻结需求、真值词典、文件围栏和量化门禁。
2. A 冻结共享 runtime 类型和 IPC 合同，再完成 fixture 可验证实现。
3. B 在不抢 A 共享文件的前提下完成真值 projection 与 UI；消费已冻结合同。
4. A/B 各自回调，主控先做静态/fixture/浏览器/Electron 验收；1920x1080 浏览器 fallback 与 Electron event p95 已通过，未完成的真实 E2E 仍保持 partial。
5. 只有 PM/user 明确给出第二次执行窗口，P0-C 才能调用一次受控 Codex dry-run。
6. P0-C 全矩阵通过后，PM 才能决定是否把 Codex 从 draft/pending 调整为 accepted/ready；调整 machine-gate 是独立任务，不在本卡自动发生。

## shared contract lock

- A 独占 `src/types.ts`、`src/lib/connectorRuntime.ts`、`electron/main.ts` Connector runtime hunk、`electron/preload.ts`、`src/lib/desktopClient.ts` 和两项 Connector 专用验收脚本。
- B 不改上述文件；B 使用 cockpit components、首页指标 hook 和受限 CSS，不修改 `agentCore.ts`。
- 当前 `electron/main.ts` 已有 M5 Day 1 未提交改动。A 必须保留并在 callback 中区分 baseline 与本 lane diff。
- C 只改 `docs/**`。

## acceptance gates

| Gate | Pass condition |
| --- | --- |
| Truth | 无有效 Session 时 online=0；8 seeds 只计 configured |
| IPC | run/stop/status/events 合同完整，订阅有 cleanup |
| Blocked safety | 10/10 未授权 fixture 不 spawn，blocked reason + audit 完整 |
| Events | started/terminal 唯一、sequence 单调、p95 <= 500ms |
| Heartbeat | 5s fresh，15s stale 后 degraded/offline，阈值可见 |
| Cancel/timeout | 1s 内接收取消，5s 内清理或明确失败；timeout 5s 内终态 |
| Recovery | 10s 内重挂或 session-lost，0 个假 running |
| Provenance | 100% KPI/Agent 详情可见 source/lastSeen/mode |
| Fallback | 浏览器恒为 simulation，Connector run 恒 blocked |
| E2E | P0-C 矩阵全部通过，0 残留进程，0 未解释终态 |

## validation

```text
npm.cmd run orchestration:check
npm.cmd run orchestration:report
npm.cmd run orchestration:preflight
npm.cmd run orchestration:connector-safety
npm.cmd run lint
npm.cmd run build
git diff --check
```

运行代码门禁不等于授权调用外部 CLI。P0-C 之前仅允许项目自身门禁、fixture 和本地 UI/Electron 验收。

## forbidden

- 不执行 Codex/Trae/Qoder/OpenClaw/Claude/MiniMax/OpenCode。
- 不改 `docs/orchestration/connectors.json` machine-gate。
- 不改 `docs/orchestration/status.json` `connectors[]`。
- 不把 A/B 写成 full accepted、summarized 或 complete；partial accepted 必须写明切片边界与剩余风险。
- 不覆盖 M5、v3.2、牧场、头像/动画和现有用户改动。
- 不 stage/commit/push/reset/clean/force-push。

## failure and rollback

- 共享合同冲突：停止 B 的合同消费，A 先冻结唯一类型版本。
- 未知进程或无法清理：停止新调度，记录 PID/session 和残留，不进入 C。
- recovery 证据不足：标记 session-lost，不显示 running。
- source 不可验证：降级 unknown/simulated，不显示 online。
- connector machine-gate 出现 diff：立即阻塞并单独上报。

## callback

```text
completed:
incomplete:
blockers:
next action:
evidence:
```

## next action

- A/B 的独立 callback、文件围栏、fixture、1280/1440/1920 浏览器 fallback 和 Electron event p95 已复核；补 P0-C 真实 Agent E2E 后再决定 full acceptance。
- P0-C 保持 standby；等待 A/B 验收与明确第二次执行授权。
