# Ranch M4 Requirements Readiness Task

[PM]#ranch-m4-requirements@v0.2
⟦tag:v2|task|ranch-m4-requirements-v0.2⟧

objective:
- Convert the next ranch milestone into a bounded requirements and acceptance package before any M4 implementation starts.
- Preserve the current M3 code baseline and keep control-cockpit selling-point files locked until implementation is explicitly dispatched.

truth sources:
- Product source: `docs/桌面牧场需求-v0.3.md`.
- Engineering source: `docs/桌面牧场工程需求-v0.2.md`.
- Development plan: `docs/桌面牧场开发计划-v0.2.md` §6 M4.
- Current control truth: `docs/orchestration/index.md` and `docs/orchestration/status.json`.

scope:
- Define the exact M4 requirement surface: rename cascade, control-cockpit ranch settings entry, and smoke expectations.
- Split requirements readiness from implementation.
- Record future write scopes and forbidden scopes before a worker edits files.
- Keep connector execution disabled and unrelated to M4.

not in scope:
- Editing `src/components/NiuMaAvatar.tsx`.
- Editing the central 4x2 control-cockpit grid in `src/components/NiuMaWorkspace.tsx`.
- Editing `src/index.css`, `src/lib/agentCore.ts`, or `icon/**`.
- Running Git repair, staging, commit, or push.
- Enabling Codex, Trae, Qoder, or any connector.
- Implementing M4 code before a separate explicit implementation dispatch.

M4 requirement surface:
- Rename cascade candidates: `package.json` description/product name, `electron/main.ts` window titles and tray tooltip, `ranch.html` title, `README.md` heading/intro, and `src/App.tsx` boot title.
- Control-cockpit addition: add a compact "桌面牧场设置" entry in the app header area, writing existing `RanchPrefs` through the desktop bridge.
- The implementation must preserve current orchestration cards, connector policy cards, and central control-cockpit selling points.
- The implementation must not rename the package code name `multi-agent-niuma`, IPC channels, persisted user data paths, or agent data files.

acceptance:
- `npm.cmd run lint` passes before and after any future implementation lane.
- `npm.cmd run build` passes before and after any future implementation lane.
- `npm.cmd run orchestration:check` passes and keeps M4 requirements represented in the PM board.
- Future M4 implementation task declares its write scope before editing files.
- Future M4 implementation task includes negative checks for locked files and connector enablement.
- Manual smoke plan covers control-cockpit title, ranch title, tray tooltip, README/product naming, and ranch settings entry behavior.

current state:
- Requirements readiness is summarized.
- Future implementation dispatch package exists at `docs/orchestration/tasks/ranch-m4-implementation-v0.2.md`.
- M3 code gates were rechecked after the latest supervision pass: `npm.cmd run lint` and `npm.cmd run build` both passed.
- M4 implementation is not started.
- Git repair and connector execution remain unauthorized.

blockers:
- M4 implementation requires a separate explicit dispatch before touching locked control-cockpit or rename files.
- Transparent ranch pointer smoke remains partially manual because Windows capture reports `SetIsBorderRequired failed`.
- Connector execution remains disabled and unrelated to M4 requirements readiness.

next action:
- Keep the future M4 implementation package standby until PM/user explicitly dispatches implementation.
- Keep this requirements lane summarized unless the M4 scope changes.

summary:
- Summarized M4 requirements readiness; implementation held behind explicit dispatch.
