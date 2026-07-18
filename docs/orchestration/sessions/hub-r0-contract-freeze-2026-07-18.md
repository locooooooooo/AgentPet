# Hub R0 Contract Freeze Supervision - 2026-07-18

[PM]#weekly-requirements@2026-07-21
⟦tag:v2|session|hub-r0-contract-freeze-2026-07-18⟧

loop state: active
dispatch state: active
status: presence_slice_accepted_pending_commit_push
date: 2026-07-18
ddl: 2026-07-18

## single goal

Close the reported local-Agent visibility gap with read-only host presence, without confusing application processes with Session/task truth or absorbing unrelated user-owned worktree changes.

## supervision callbacks

| Supervisor | Scope | Result | Key finding | Changed files |
| --- | --- | --- | --- | --- |
| `/root/hub_ui_status_audit` | Workspace truth versus synthetic UI semantics | completed | Physiological meters are removed, but avatar animation and status color still consume synthetic local runtime state; UI is not accepted | none |
| `/root/hub_contract_gap_audit` | Positioning, README, DockView and sound inputs | completed | All four formal contracts are missing; three product decisions and contract-specific negative tests are required | none |
| `/root/hub_orchestration_intake` | Truth source, control baseline and Owner split | completed after bounded follow-up | Reuse the two existing active lanes, write an eight-file control baseline and keep four contract files mutually exclusive | none |

No supervisor edited, staged, committed or pushed files. No supervisor ran an external Agent CLI or encountered `403 DAILY_LIMIT_EXCEEDED`.

## PM decisions

- Six support states are independent evidence facets, never a Manifest-authored maturity level.
- `accepted / success / attention / failure / stopped / recovered` is the canonical sound receipt vocabulary; view status labels cannot create receipts.
- Simulation and audition are isolated `preview` events with no Runtime, online, terminal or business-completion side effects.
- Existing Connector policy remains authoritative and every external execution gate stays closed.

## completed

- Re-read `docs/orchestration/index.md`, `status.json`, the active daily/weekly truth, scheduler closeout evidence and the five user-owned Hub candidate changes.
- Confirmed `HEAD == origin/main == b4789cb` and an empty Git index before this control edit.
- Collected all three formal read-only callbacks and independently reran the baseline orchestration check/report plus `git diff --check`.
- Frozen the four contract filenames, non-overlapping Owner fences, dependency order, negative-test expectations and full recurring gate set in `hub-r0-contract-freeze-v0.1.md`.

## presence-only acceptance evidence

- The docs-only control baseline was committed/pushed as `2a2f7f5`; local and remote refs matched before implementation review.
- Manifest/InstallPlan passed exact-file review for identity, executable and fail-closed evidence boundaries. Adapter Capability passed exact-file review for host/workstation/Connector/Session/task separation. Neither contract enables a Connector or establishes a supported Adapter.
- `realtime:truth-check` passed host discovery, projection and renderer fixtures. Kimi helpers aggregate into one discovered application; WorkBuddy/MiniMax bind only by exact identity; host-only facts leave online/busy at zero.
- `orchestration:check` reported 122 cards; report, preflight, Connector safety, lint, build and `git diff --check` passed.
- Live process evidence observed 9 `Kimi.exe` processes and one `kimi-webbridge`; no WorkBuddy or MiniMax primary process was present.
- Isolated Electron replay at `1204x795` visibly rendered `未绑定发现项 Kimi（9 进程）`, `Connector 0 · Codex Desktop 2` and `0 个应用任务运行中`.
- Computer Use window capture failed on the known `SetIsBorderRequired failed (0x80004002)` path. Read-only Electron DevTools DOM plus PNG capture provided the fallback evidence without clicking or typing in the user's active window.

## incomplete

- The accepted presence slice is not delivered until its exact staged snapshot passes and the commit is pushed with remote parity.
- HubTheme and HubSoundPack formal contracts remain missing, so the broader R0 contract batch is incomplete.
- README, DockView, positioning and sound input documents remain unaccepted candidate changes.
- Unrelated Workspace meter-removal hunks and the remaining synthetic avatar/status semantics are outside this acceptance.

## blockers

- No platform, Agent quota or host-presence file-fence blocker is currently known.
- Broader R0 completion remains blocked by missing Theme/SoundPack contracts and unresolved full UI truth semantics.
- External Connector execution remains disabled and no P0-C authorization is inferred from host discovery.

## next action

1. Stage only the two accepted contracts, host-presence implementation/tests and this orchestration update; partially stage Workspace host hunks and exclude unrelated meter-removal hunks.
2. Verify the exact staged snapshot with recurring gates and a staged diff audit.
3. Commit/push the presence slice and confirm `HEAD == origin/main` plus remote `main` parity.
4. Keep Theme/SoundPack and broader UI truth work as the next separately fenced R0 contract lanes.

## changed files

- `docs/orchestration/tasks/hub-r0-contract-freeze-v0.1.md`
- `docs/orchestration/sessions/hub-r0-contract-freeze-2026-07-18.md`
- `docs/orchestration/index.md`
- `docs/orchestration/status.json`
- `docs/orchestration/sessions/weekly-requirements-2026-07-21.md`
- `docs/orchestration/sessions/daily-plan-2026-07-17.md`
- `docs/orchestration/sessions/daily-supervision-2026-07-02.md`
- `docs/orchestration/tasks/daily-role-accountability-2026-07-02.md`
- `docs/牛马Hub-AgentManifest与InstallPlan合同-v0.1.md`
- `docs/牛马Hub-AdapterCapability合同-v0.1.md`
- `electron/agentHostDiscovery.ts`
- `electron/main.ts`
- `src/types.ts`
- `src/lib/agentInstanceProjection.ts`
- `src/lib/desktopClient.ts`
- `src/App.tsx`
- `src/components/NiuMaWorkspace.tsx` host-presence hunks only
- `scripts/check-agent-host-discovery.mjs`
- `scripts/check-agent-instance-projection.mjs`
- `scripts/check-realtime-truth-renderer.mjs`
- `package.json`
