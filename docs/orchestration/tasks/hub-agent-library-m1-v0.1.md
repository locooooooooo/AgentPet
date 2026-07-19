# Hub M1.1 Agent Library v0.1

[PM]#hub-agent-library-m1@v0.1
⟦tag:v2|task|hub-agent-library-m1-v0.1⟧

loop state: summarized
dispatch state: summarized
status: implemented_packaged_smoke_verified
date: 2026-07-19
priority: M1.1

## goal

Deliver the first read-only Agent Library slice for HUB-LC-01 without opening any external Connector. The Library must expose catalog identity, support level, version evidence, installed/running facts, Connector readiness and observed-at/source metadata, while keeping host process presence separate from Session, online and coordinatable truth.

## bounded implementation

Allowed product files:

- `src/lib/agentLibrary.ts`
- `src/components/NiuMaWorkspace.tsx`
- `src/index.css`
- `scripts/check-agent-library.mjs`
- `scripts/smoke-packaged-agent-lifecycle.mjs`
- `package.json`

The slice registers six lifecycle candidates: Codex, Trae, WorkBuddy, Qoder, MiniMax and OpenClaw. Unbound host facts such as Kimi may appear as `detected` discovery entries, but do not become installed, launchable, connectable or coordinatable without independent evidence.

Explicit non-goals:

- No installer, downloader, version command, credential handling or InstallPlan executor.
- No main/preload IPC change and no Connector machine-gate change.
- No external Agent CLI execution, no P0-C authorization inference and no Headless Adapter acceptance.
- No dependency workflow UI or claims about M2 completion.
- No DockView, Theme runtime or SoundPack runtime implementation.

## acceptance

- `catalogued -> detected -> installed -> launchable -> connectable -> coordinatable` is derived from evidence and never skipped by declaration alone.
- Version is explicitly `unknown` with `version-not-observed` source until a real version probe exists.
- Host process presence cannot self-grant installed; unbound Kimi remains `detected`, installed `unknown`, Connector `unregistered`.
- Pending/rejected/disabled Connector policy remains blocked or pending; no entry becomes coordinatable under the current policy.
- The UI is a searchable/filterable table and preserves the existing 4x2 workstation grid and Session projection.
- A packaged Electron smoke opens and closes the Library, verifies six registered rows, support levels, evidence sources and zero table overflow.

## verification

- `node scripts/check-agent-library.mjs`: pass.
- `npm.cmd run realtime:truth-check`: pass, including the Library checker and existing renderer truth checks.
- `npm.cmd run lint`: pass.
- `npm.cmd run build`: pass.
- `npm.cmd run package:win`: pass; packaged executable `release/desktop-ranch-win-unpacked-20260719-191902/桌面牧场.exe`.
- `node scripts/smoke-packaged-agent-lifecycle.mjs --library-screenshot=docs/orchestration/sessions/hub-agent-library-p0-2026-07-19.png`: pass.
- `git diff --check`: pass.

## residual gap

This closes only M1.1 HUB-LC-01 read-only projection. Full M1 still needs an accepted InstallPlan, independent version evidence, three complete install/launch/recheck rollbacks and a separate acceptance card. M2 still needs two accepted Headless Adapters and a real cancellable audited dependency workflow.

next action:
- Keep the Library slice accepted and wait for remaining M0 decisions before expanding lifecycle execution; do not infer Headless or workflow readiness from this card.

evidence:
- `docs/orchestration/sessions/hub-agent-library-m1-2026-07-19.md`
