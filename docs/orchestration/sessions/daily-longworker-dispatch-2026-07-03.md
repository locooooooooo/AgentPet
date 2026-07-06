[PM]#daily-longworker-dispatch@2026-07-03

⟦tag:v2|session|daily-longworker-dispatch-2026-07-03⟧

loop state: summarized
dispatch state: summarized

date: 2026-07-03
source plan: `docs/orchestration/sessions/daily-plan-2026-07-03.md`
current route: Y / cockpit refactor P0
current progress: `docs/orchestration/sessions/cockpit-refactor-p0-progress.md`

dispatch principle:
- User has explicitly authorized `[长工]` dispatch for today's plan.
- Do not run X real-integration and Y cockpit-refactor implementation in parallel.
- Keep today's implementation lane on Y; use R0 only as evidence/readiness review.
- External connector execution remains disabled; no Codex/Trae/Qoder binding, no `enabledByDefault: true`.
- Preserve the central 4x2 selling-point matrix and protected ranch files.

long-worker queue:

| order | worker | lane | state | ownership |
|---|---|---|---|---|
| 1 | `[长工]#cockpit-statusstrip@2026-07-03` | C0-3 / P0-2 StatusStrip | dispatch_ready | `src/components/StatusStrip.tsx`, narrow integration in `src/components/NiuMaWorkspace.tsx`, `.status-strip*` CSS only |
| 2 | `[长工]#cockpit-visual-acceptance@2026-07-03` | C0-2 visual acceptance | dispatch_ready_parallel_readonly | screenshot/smoke evidence only; no code edits |
| 3 | `[长工]#r0-evidence-reconcile@2026-07-03` | R0 evidence and blocker reconcile | dispatch_ready_readonly | progress/status consistency only; no connector enablement |
| 4 | `[长工]#daily-closeout@2026-07-03` | evening supervision closeout | wait_for_callbacks | daily summary and final gates after 1-3 callbacks |
| 5 | `[长工]#cockpit-tab-panel@next` | C0-4 Tab panel | tomorrow_queue | do not start until C0-3 accepted |
| 6 | `[长工]#cockpit-float-disposal@next` | C0-5 central floating panel | tomorrow_queue | do not start until C0-4 accepted |

dispatch package 1:
```text
[长工]#cockpit-statusstrip@2026-07-03
⟦tag:v2|task|cockpit-refactor-p0-v0.1⟧

Read first:
1. docs/orchestration/index.md
2. docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md
3. docs/orchestration/sessions/cockpit-refactor-p0-progress.md
4. docs/主页面重构方案-v3.0-控制舱收口.md
5. src/components/NiuMaWorkspace.tsx
6. src/index.css

Objective:
Implement C0-3 / P0-2 StatusStrip only.

Allowed files:
- src/components/StatusStrip.tsx
- src/components/NiuMaWorkspace.tsx only for replacing the existing connector/status presentation with StatusStrip
- src/index.css only for .status-strip and .status-strip-dropdown classes
- docs/orchestration/sessions/cockpit-refactor-p0-progress.md only for callback evidence

Forbidden:
- Do not edit src/components/NiuMaAvatar.tsx.
- Do not edit src/lib/agentCore.ts.
- Do not alter the central 4x2 agent board / .agent-board / AgentCard behavior.
- Do not enable or execute Codex/Trae/Qoder connectors.
- Do not start C0-4 or C0-5.

Acceptance:
- StatusStrip is one 36px row.
- It shows connector status, task count, and last event.
- Hover displays complete connector card details.
- Existing connector chip/status color semantics remain intact.
- npm.cmd run lint passes.
- npm.cmd run build passes.
- npm.cmd run orchestration:check passes.

Callback format:
completed:
incomplete:
blockers:
next action:
evidence:
```

dispatch package 2:
```text
[长工]#cockpit-visual-acceptance@2026-07-03
⟦tag:v2|task|cockpit-refactor-p0-v0.1⟧

Read first:
1. docs/orchestration/index.md
2. docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md
3. docs/orchestration/sessions/cockpit-refactor-p0-progress.md

Objective:
Verify C0-2 visual behavior and collect evidence. This is read-only except optional evidence notes.

Scope:
- Confirm 5 P0 task cards render in the orchestration panel.
- Confirm exactly 1 active card and 4 dimmed cards.
- Confirm hover temporarily highlights the hovered card and dims the others.
- Confirm central 4x2 agent board still renders unchanged enough for smoke acceptance.

Allowed:
- Browser/Electron visual smoke.
- Screenshots or DOM assertions.
- Append evidence to cockpit progress only if needed.

Forbidden:
- No implementation edits.
- No connector execution.
- No Git staging/commit/push.

Acceptance:
- Evidence includes URL/runtime surface, card count, active/dimmed count, hover observation, and any screenshot path if captured.
- npm.cmd run orchestration:check remains passing if docs are touched.

Callback format:
completed:
incomplete:
blockers:
next action:
evidence:
```

dispatch package 3:
```text
[长工]#r0-evidence-reconcile@2026-07-03
⟦tag:v2|task|ranch-real-integration-p0-v0.1⟧

Read first:
1. docs/orchestration/index.md
2. docs/orchestration/status.json
3. docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md
4. docs/orchestration/sessions/ranch-real-integration-p0-progress.md
5. docs/orchestration/tasks/connector-policy-v0.1.md
6. docs/orchestration/tasks/connector-acceptance-review-v0.1.md

Objective:
Reconcile R0 progress with the current Y route. This is a review/PM evidence lane, not a new R0 implementation lane.

Allowed:
- Read-only diagnosis.
- Propose exact status wording for R0 if needed.
- Report whether R0 should remain in_progress, summarized, or blocked under the current connector policy.

Forbidden:
- Do not modify electron/main.ts, src/lib/agentCore.ts, connectors.json, README.md, or connector gates.
- Do not set approvalStatus to accepted.
- Do not set enabledByDefault to true.
- Do not run real external agent connectors.

Acceptance:
- Report clearly separates completed R0-1/R0-2 evidence from blocked R0-3/R0-4/R0-5.
- If proposing a status change, cite exact files and reason.
- No file changes unless PM explicitly opens a correction lane.

Callback format:
completed:
incomplete:
blockers:
next action:
evidence:
```

dispatch package 4:
```text
[长工]#daily-closeout@2026-07-03
⟦tag:v2|session|daily-supervision-2026-07-03⟧

Wait condition:
Start only after callbacks from cockpit-statusstrip, cockpit-visual-acceptance, and r0-evidence-reconcile are available or explicitly waived by PM/user.

Objective:
Write the daily closeout around the actual selected route Y and today's verified evidence.

Allowed files:
- docs/orchestration/sessions/daily-supervision-2026-07-03.md
- docs/orchestration/sessions/cockpit-refactor-p0-progress.md
- docs/orchestration/status.json only if changing P0 statuses after evidence is accepted
- scripts/check-orchestration.mjs only if status expectations are intentionally changed by PM

Required commands:
- npm.cmd run orchestration:report
- npm.cmd run orchestration:check
- npm.cmd run lint
- npm.cmd run build

Acceptance:
- Closeout says Q1 route is Y, not X.
- C0-2 and C0-3 evidence are separated.
- R0 remains evidence/review only unless PM/user reopens it.
- Blockers include connector disabled state and transparent pointer-smoke blocker if still true.

Callback format:
completed:
incomplete:
blockers:
next action:
evidence:
```

not dispatched today:
- `[长工]#cockpit-tab-panel@next`: C0-4 waits for C0-3 acceptance.
- `[长工]#cockpit-float-disposal@next`: C0-5 waits for C0-4 acceptance.
- Any P2 decorative cockpit work.
- Any external connector execution or acceptance.
- Any Git stage/commit/push/cleanup lane.

completed:
- LPS long-worker queue defined.
- Dispatch packages 1-4 are ready to copy into long-worker threads.
- Repo-local long-worker session cards have been created:
  - `docs/orchestration/sessions/cockpit-statusstrip-2026-07-03.md`
  - `docs/orchestration/sessions/cockpit-visual-acceptance-2026-07-03.md`
  - `docs/orchestration/sessions/r0-evidence-reconcile-2026-07-03.md`
  - `docs/orchestration/sessions/daily-closeout-2026-07-03.md`

incomplete:
- External Codex app threads were not created because the user asked to use repo-local sessions directly.
- Actual callbacks from long workers are pending.

blockers:
- No callable Codex thread dispatch tool is exposed in this session.
- External connector execution remains disabled.

next action:
- Long workers execute from the four repo-local session cards above and return callbacks in the required format.
- Main steward collects callbacks and accepts/rejects each lane by evidence.

evidence:
- `docs/orchestration/index.md`
- `docs/orchestration/status.json`
- `docs/orchestration/sessions/daily-plan-2026-07-03.md`
- `docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md`
- `docs/orchestration/sessions/cockpit-refactor-p0-progress.md`
- `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`
- `docs/orchestration/sessions/ranch-real-integration-p0-progress.md`
