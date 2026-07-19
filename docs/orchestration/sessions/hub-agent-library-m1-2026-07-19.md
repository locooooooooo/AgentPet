# Hub M1.1 Agent Library Evidence - 2026-07-19

[PM]#hub-agent-library-m1@v0.1
⟦tag:v2|session|hub-agent-library-m1-2026-07-19⟧
loop state: standby
dispatch state: standby
status: implemented_packaged_smoke_verified
date: 2026-07-19
priority: M1.1

## delivered

- Added a pure `projectAgentLibrary` projection over the existing host discovery, Codex Desktop lifecycle, Agent truth projection and Connector policy/gate evidence.
- Registered Codex, Trae, WorkBuddy, Qoder, MiniMax and OpenClaw as six catalog entries; unbound host facts are rendered separately.
- Added support-level derivation, explicit unknown version evidence, installed/running/lifecycle state, Connector readiness and evidence source/time for every row.
- Added a searchable/filterable Agent Library dialog without changing main/preload IPC, the central workstation grid or Session projection.
- Added deterministic negative fixtures and packaged CDP interaction checks.

## packaged evidence

- Executable: `release/desktop-ranch-win-unpacked-20260719-191902/桌面牧场.exe`.
- Viewport: `1204x795`.
- Library registered rows: `6`.
- Current packaged rows: `Codex installed`, `Trae/MiniMax/Qoder/WorkBuddy launchable`, `OpenClaw installed`; no row is connectable/coordinatable under the current Connector policy.
- Unbound Kimi discovery: `detected`, installed `unknown`, running `yes`, Connector `unregistered` when present.
- Table horizontal overflow: `0`; page and existing Session detail overflow remain `0`.
- Library screenshot: `docs/orchestration/sessions/hub-agent-library-p0-2026-07-19.png` (`142336` bytes, `electron-cdp-page-capture`).
- Normal cockpit screenshot: `docs/orchestration/sessions/hub-agent-library-p0-normal-2026-07-19.png` (`213346` bytes, `electron-cdp-page-capture`).
- Process tree and temporary Electron profile were cleaned by the smoke harness.

## checks

- `node scripts/check-agent-library.mjs`: pass.
- `npm.cmd run realtime:truth-check`: pass; host/action/instance/session/library/renderer checks all pass and external spawn remains `0`.
- `npm.cmd run lint`: pass.
- `npm.cmd run build`: pass.
- `npm.cmd run package:win`: pass.
- `node scripts/smoke-packaged-agent-lifecycle.mjs --library-screenshot=docs/orchestration/sessions/hub-agent-library-p0-2026-07-19.png`: pass.
- `git diff --check`: pass.

## boundary

- This is a read-only M1.1 projection, not full M1 lifecycle acceptance.
- No InstallPlan executor, version probe, credential flow, Connector enablement, external Agent CLI or Headless Adapter was added.
- OpenClaw risk/auth, P0-C, Trae Models and Qoder Headless API remain separately gated.
- M2 dependency workflow remains unimplemented and unaccepted.

next action:
- Preserve this evidence and open a separately fenced lifecycle execution card only after the remaining M0 decisions are explicitly closed or deferred.
