# realtime-agent-cockpit-p0-c-codex-acceptance-v0.1

[长工]#realtime-requirements-control@v0.1
⟦tag:v2|task|realtime-agent-cockpit-p0-c-codex-acceptance-v0.1⟧

loop state: standby
dispatch state: standby
status: authorization_required
date: 2026-07-13
priority: P0-C

## objective

在 P0-A/P0-B 通过独立验收后，用一次明确授权、只读、限目录、限环境、限时的 Codex controlled dry-run 证明真实 Session 全链路。当前卡仅定义验收，不授权也不执行外部 CLI。

## hard preconditions

以下全部满足前，本卡保持 standby：

1. A7.1 已独立验收并提交推送，B2 fresh rerun 通过且未解决 blocker 为 0。
2. 主控核对文件围栏，保留 M5 `electron/main.ts` 基线改动。
3. orchestration:check/report/preflight/connector-safety、lint、build、git diff --check 全通过。
4. blocked-path fixture 10/10 不 spawn，并有审计。
5. browser fallback 明确 simulation，online 不再来自 seeds。
6. restart/cancel/timeout fixture 已通过，无残留进程。
7. PM/user 在新的明确消息中给出第二次执行窗口与只读 dry-run 授权。
8. 授权消息确认 cwd、任务目标、timeout、允许读取范围、禁止写入和停止条件。

“本机可发现 codex”不是执行授权。现有 `draft/pending/enabledByDefault=false` 也不得由本卡自动改动。

## controlled run envelope

- connector: Codex only。
- requestedBy: explicit-user-action。
- task: 只读读取一个已知小文件并返回固定结构摘要；不得修改工作区。
- cwd: workspace root，解析后不得越界。
- env: accepted allowlist only，不打印完整环境。
- shell: false。
- timeout: 最长 120 秒；实际值由授权消息确认。
- retry: 0。
- output: 结构事件 + 脱敏日志；输出大小有限制。
- stop: 用户取消、timeout、policy drift、未知写入、cwd 越界、秘密泄露迹象立即停止。

具体非交互参数必须来自 A 的已验收 Adapter，不在 renderer 或本卡中拼接任意 shell command。

## E2E matrix

| ID | Scenario | Pass evidence |
| --- | --- | --- |
| C-01 | policy blocked | spawn=0；blocked reason/audit 完整 |
| C-02 | confirmation missing | spawn=0；UI 与 audit 同一原因 |
| C-03 | controlled start | 获得 taskId/sessionId/PID/source=real |
| C-04 | event stream | started、log/progress、terminal 顺序完整，p95 <= 500ms |
| C-05 | success | exit/Adapter terminal -> completed，任务与 Session 一致 |
| C-06 | cancel | 1 秒接收，5 秒内 cancelled/退出，无残留 |
| C-07 | timeout | 5 秒内 timed-out/清理，无假 running |
| C-08 | renderer reload | 状态重取一致，无重复订阅/重复终态 |
| C-09 | app restart | 10 秒内 reattached 或 session-lost |
| C-10 | audit/provenance | request/gate/session/events/result/source/lastSeen 可查且已脱敏 |
| C-11 | fallback | browser 恒 simulation，run blocked |
| C-12 | post-run cleanup | 0 残留子进程，0 未解释 running，0 工作区写入 |

## acceptance evidence package

- 执行授权原文引用。
- 执行前/后 `git status --short` 和受控文件 hash/diff 负证据。
- gate decision、Adapter spec 摘要、cwd/env allowlist、timeout/retry。
- taskId、sessionId、PID、source、connectedAt、lastSeen。
- 完整结构事件序列和延迟统计。
- cancel/timeout/recovery fixture 证据。
- 控制舱 real/simulated/source/lastSeen 截图。
- 进程清理和 0 残留证据。
- 四项 orchestration gate、lint/build、git diff --check。

## acceptance decision

- `accepted`：C-01 到 C-12 全部通过，0 高风险残留，PM 独立确认。
- `partial`：主路径通过但 recovery/cancel/timeout/审计任一不完整；不得启用 Connector。
- `rejected`：出现越权写入、秘密泄露、未知进程、假在线、无法清理或 machine-gate 绕过。

即使本卡 accepted，Codex connector machine-gate 的 `approvalStatus/status/enabledByDefault` 调整仍需独立 PM/user 决策与独立任务，不自动修改。

## forbidden

- 当前执行此卡。
- 调用 Trae/Qoder/OpenClaw/Claude/MiniMax/OpenCode。
- 改 connectors.json 或 status.json connectors[]。
- 为通过验收关闭 gate、放宽 cwd/env、使用 shell 或隐藏失败事件。
- stage/commit/push/reset/clean。

## callback

```text
completed:
incomplete:
blockers:
next action:
evidence:
```

当前 callback 应保持：`completed=acceptance plan + 2026-07-15 decision packet`、`incomplete=controlled dry-run`、`blockers=A7.1 acceptance + B2 rerun pass + second authorization`。

当前决策真源：`docs/orchestration/sessions/realtime-agent-cockpit-p0-c-authorization-decision-2026-07-15.md`，结论为 `DO NOT AUTHORIZE P0-C NOW`。
