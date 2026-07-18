# Hub R0 Contract Freeze v0.1

[PM]#hub-r0-contract-freeze@v0.1
⟦tag:v2|task|hub-r0-contract-freeze-v0.1⟧

loop state: active
dispatch state: active
status: presence_slice_delivered_04524e8_full_contract_batch_incomplete
date: 2026-07-18
ddl: 2026-07-18

## single goal

Accept the minimum identity and Adapter truth contracts needed for read-only host presence, deliver that presence slice without external execution, and keep the broader four-contract R0 batch closed until Theme and SoundPack contracts also pass.

## confirmed baseline

- Scheduler configurable concurrency is accepted/pushed at `4508ce3`; S/R/C fixtures pass, same-Agent reservation remains `1`, and external Agent spawn remains `0`.
- The docs-only control baseline is committed and pushed at `2a2f7f5`; local `HEAD`, `origin/main` and remote `main` matched before the presence slice.
- The shared worktree contains user-owned candidate edits in `README.md`, `src/components/NiuMaWorkspace.tsx` and three Hub product documents. They remain unstaged and are not accepted by this card.
- Three bounded read-only supervisors audited UI truth semantics, orchestration intake and contract gaps. All returned formal callbacks, changed no files and encountered no `403 DAILY_LIMIT_EXCEEDED`.
- The current active control lanes remain `daily-supervision` and `weekly-requirements`; this task does not add a third active lane.

## presence-only priority override

- The administrator reported that locally running WorkBuddy, Kimi and MiniMax were absent from the panel. This makes truthful local application discovery the current product priority.
- `docs/牛马Hub-AgentManifest与InstallPlan合同-v0.1.md` is independently accepted only for canonical Agent identity, exact executable binding and the rule that process presence cannot self-grant installed, Session or task state.
- `docs/牛马Hub-AdapterCapability合同-v0.1.md` is independently accepted only for the host-presence / workstation-binding / Connector / Session / task separation. No Adapter capability is accepted as supported.
- Theme and SoundPack contracts remain incomplete and still block the broader Hub R0 batch, but they do not improve or protect this read-only status fix and therefore do not block the presence-only slice.
- The presence implementation is bounded to shared types, one Windows read-only probe, main-process snapshot composition, existing truth projection, existing control-cockpit rendering and deterministic fixtures. It does not read command lines, paths, window titles, prompts or logs and does not launch an external Agent.

## first-principles decisions

1. The six support states are independent evidence-derived facets, not one self-declared maturity enum. A Manifest may describe compatibility inputs, but only observed evidence may establish `discoverable`, `installable`, `launchable`, `connectable`, `observable` or `coordinatable` support.
2. The canonical receipt vocabulary is `accepted`, `success`, `attention`, `failure`, `stopped` and `recovered`. Product status wording such as start/wait/done/offline is a view mapping and may never be used as the source of a receipt event.
3. Simulation and sound audition use an explicit `preview` channel. Preview events never enter Runtime truth, never change online/terminal state, never emit a business completion and never count as acceptance evidence.
4. Connector machine policy, authorization, cwd/env limits and enabled state remain authoritative. No contract declaration may enable a Connector or authorize execution.

## contract file fences

| Wave | Owner | Only writable file | Dependency |
| --- | --- | --- | --- |
| A | `[长工]#hub-agent-install-contract@v0.1` | `docs/牛马Hub-AgentManifest与InstallPlan合同-v0.1.md` | This pushed control baseline |
| A | `[短工]#hub-theme-contract@v0.1` | `docs/牛马Hub-HubTheme合同-v0.1.md` | This pushed control baseline |
| A | `[短工]#hub-sound-pack-contract@v0.1` | `docs/牛马Hub-HubSoundPack合同-v0.1.md` | This pushed control baseline |
| B | `[长工]#hub-adapter-capability-contract@v0.1` | `docs/牛马Hub-AdapterCapability合同-v0.1.md` | AgentManifest + InstallPlan independently accepted |

Contract workers may read related files but may not edit `README.md`, existing Hub/DockView/sound documents, `src/**`, `electron/**`, Connector configuration, `docs/orchestration/**` or another contract Owner's file. They may not stage, commit, push or invoke an external Agent CLI.

## minimum contract shape

Every contract must include:

- Versioned schema identity, required fields and field types.
- Compatibility, unknown-version, migration and fail-closed behavior.
- Derived-state rules that distinguish declarations from observed evidence.
- Security, permission, integrity hash, provenance and license boundaries where applicable.
- At least one valid example and two invalid examples.
- An explicit negative-test acceptance matrix with no TODO or placeholder text.

Contract-specific hard gates:

- `AgentManifest + InstallPlan`: a Manifest cannot self-grant support; install steps are structured, auditable, cancellable and explicit about elevation, network, filesystem and recovery effects.
- `Adapter Capability`: `supported / unsupported / unknown` is evidence-backed; missing truth, version drift or incomplete lifecycle capability fails closed; the contract cannot bypass Connector policy.
- `HubTheme`: packages are declarative and non-executable; remote URLs, path traversal, scripts and bad hashes are rejected; preview and last-known-good rollback are explicit.
- `HubSoundPack`: packs cannot override global mute, quiet hours, priority, aggregation, rate limits or `eventId` deduplication; identity tails have an unknown-Agent fallback; preview is isolated from business truth.

## explicit non-goals

- No installer, downloader, updater, launcher or Adapter runtime implementation.
- No Connector machine-gate change and no external Agent execution.
- No DockView or multi-window implementation.
- No theme or sound asset creation, download or playback-engine implementation.
- No external application skinning, marketplace execution or plugin runtime.
- No shared UI restructuring and no acceptance of the current README or product-document candidate diffs. Only the host-presence hunks in the existing Workspace file are eligible for this slice; unrelated meter-removal hunks remain unstaged.

## acceptance gates

Each contract requires an independent reviewer and exact-file diff audit. The R0 batch is accepted only when all four contracts pass together:

```text
npm.cmd run orchestration:check
npm.cmd run orchestration:report
npm.cmd run orchestration:preflight
npm.cmd run orchestration:connector-safety
npm.cmd run realtime:truth-check
npm.cmd run lint
npm.cmd run build
git diff --check
```

PM then stages only accepted contract/control files, verifies the staged snapshot, commits, pushes and confirms `HEAD == origin/main`. README, positioning documents and UI truth removal are separate acceptance lanes after the contracts.

## worker callback

```text
completed:
incomplete:
blockers:
next action:
evidence:
changed files:
```

## presence slice acceptance

- Host discovery, projection and renderer fixtures pass, including exact basename matching, Kimi multi-process aggregation, unavailable/unsupported fail-closed behavior and online/busy counts fixed at zero for host-only facts.
- Full `orchestration:check`, report, preflight, Connector safety, realtime truth, lint, build and `git diff --check` pass in the shared worktree.
- Live Windows evidence at 2026-07-18 16:26 +08:00 observed `Kimi.exe` count `9` plus one `kimi-webbridge` helper; WorkBuddy and MiniMax primary processes were absent.
- An isolated Electron control-cockpit replay at `1204x795` displayed `1 个本机 Agent 应用已发现 · 未绑定发现项 Kimi（9 进程）`, while the online line remained `Connector 0 · Codex Desktop 2` and application-task count remained `0`.
- Direct Computer Use screenshot binding still failed with `SetIsBorderRequired failed (0x80004002)`. The isolated Electron DevTools DOM and PNG capture supplied the visible fallback evidence; transparent ranch pointer acceptance remains a separate residual risk.

## current decision

- The administrator explicitly ordered Hub work to continue and workers to start. This authorizes bounded in-app contract work, not external Agent execution.
- The control baseline already has remote parity at `2a2f7f5`. Manifest and Adapter contract candidates now exist and are accepted only for the presence slice described above.
- Selectively stage the two accepted contracts, host-presence implementation/tests and this control update. Exclude README, DockView, positioning, sound input and unrelated Workspace hunks.
- Presence implementation and contracts were committed as `04524e8 feat(runtime): show local Agent host presence`; local `HEAD`, `origin/main` and GitHub `main` match.
- Theme/SoundPack cross-review, README/product-document reconciliation and full UI truth acceptance remain mandatory before the broader Hub R0 batch can close or any installer/Adapter execution lane can open.
