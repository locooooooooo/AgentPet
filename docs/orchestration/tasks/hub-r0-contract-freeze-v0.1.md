# Hub R0 Contract Freeze v0.1

[PM]#hub-r0-contract-freeze@v0.1
⟦tag:v2|task|hub-r0-contract-freeze-v0.1⟧

loop state: active
dispatch state: active
status: accepted_for_contract_dispatch_after_remote_parity
date: 2026-07-18
ddl: 2026-07-18

## single goal

Freeze and independently accept Hub R0 positioning plus four versioned contracts before any installer, Adapter runtime, DockView, theme, sound asset or external Agent implementation starts.

## confirmed baseline

- Scheduler configurable concurrency is accepted/pushed at `4508ce3`; S/R/C fixtures pass, same-Agent reservation remains `1`, and external Agent spawn remains `0`.
- Dispatch baseline is `HEAD == origin/main == b4789cb` before this control update.
- The shared worktree contains user-owned candidate edits in `README.md`, `src/components/NiuMaWorkspace.tsx` and three Hub product documents. They remain unstaged and are not accepted by this card.
- Three bounded read-only supervisors audited UI truth semantics, orchestration intake and contract gaps. All returned formal callbacks, changed no files and encountered no `403 DAILY_LIMIT_EXCEEDED`.
- The current active control lanes remain `daily-supervision` and `weekly-requirements`; this task does not add a third active lane.

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
- No shared UI restructuring and no acceptance of the current README/UI candidate diff.

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

## current decision

- The administrator explicitly ordered Hub work to continue and workers to start. This authorizes bounded in-app contract work, not external Agent execution.
- Contract dispatch starts only after this docs-only control baseline is committed and pushed with remote parity.
- Wave A may run in parallel because its three files do not overlap. Wave B starts only after the AgentManifest + InstallPlan contract passes independent review.
- Four-contract cross-review, README/product-document reconciliation and UI truth acceptance remain mandatory before opening any implementation lane.
