# Ranch M4 Implementation Dispatch Package

[长工]#ranch-m4-implementation@v0.2
⟦tag:v2|task|ranch-m4-implementation-v0.2⟧

objective:
- Implement Ranch M4 rename + control-cockpit linkage after the user's explicit demand to stop solo PM work and move requirements through long-workers.
- Preserve the current M3 ranch interaction baseline and keep connector execution disabled.

dispatch state:
- Summarized. User challenged the PM to use long-workers and move requirements, so PM dispatched thread `019f227a-8978-7df1-8b3f-738ccdb01b18` with `gpt-5.4` + `xhigh`; the worker completed the declared write scope and PM verified the result.
- All future M4 or ranch follow-up work requires a new bounded dispatch.

truth sources:
- Requirements readiness: `docs/orchestration/tasks/ranch-m4-requirements-v0.2.md`.
- Product source: `docs/桌面牧场需求-v0.3.md`.
- Engineering source: `docs/桌面牧场工程需求-v0.2.md`.
- Development plan: `docs/桌面牧场开发计划-v0.2.md` §6 M4.

current M4 preflight:
- Already aligned: `electron/main.ts` has main window title `桌面牧场 · 控制舱`, ranch window title `桌面牧场`, and tray tooltip `桌面牧场`.
- Already aligned: `ranch.html` has `<title>桌面牧场</title>`.
- Completed: `package.json` description/productName now use `桌面牧场` while `name` remains `multi-agent-niuma`.
- Completed: `README.md` H1 and intro use `桌面牧场` while preserving project code name `multi-agent-niuma`.
- Completed: `src/App.tsx` boot screens use `桌面牧场 · 控制舱`.
- Completed: control cockpit header uses `桌面牧场 · 控制舱` and exposes a compact app-header ranch settings entry.

active write scope:
- `package.json`: update `description`; add or update `productName` only if the package tooling accepts it without breaking build.
- `README.md`: update H1 and short introduction to product name `桌面牧场`, keeping project code name `multi-agent-niuma`.
- `src/App.tsx`: update boot-screen H1 strings only.
- `src/components/NiuMaWorkspace.tsx`: add a compact app-header ranch settings entry only; do not restructure the central control-cockpit grid.
- `electron/main.ts`: verify existing M4 title/tooltip values; edit only if they drift before dispatch.
- `ranch.html`: verify title; edit only if it drifts before dispatch.

forbidden scope:
- Do not edit `src/components/NiuMaAvatar.tsx`.
- Do not edit the central 4x2 control-cockpit grid inside `src/components/NiuMaWorkspace.tsx`.
- Do not edit `src/index.css`, `src/lib/agentCore.ts`, or `icon/**`.
- Do not rename `package.json` `name`, IPC channels, persisted user data paths, or agent data files.
- Do not edit `docs/orchestration/connectors.json` to accept or enable any connector.
- Do not run Git repair, staging, commit, push, reset, clean, or file removal.

implementation acceptance:
- Callback lists every touched file and line-level purpose.
- `npm.cmd run lint` passes.
- `npm.cmd run build` passes.
- `npm.cmd run orchestration:check` passes.
- `npm.cmd run orchestration:preflight` passes and reports no enabled connector.
- Search confirms no connector has `"enabledByDefault": true` or `"approvalStatus": "accepted"`.
- Browser or Electron smoke verifies:
  - control-cockpit boot/title text uses `桌面牧场 · 控制舱`.
  - ranch title remains `桌面牧场`.
  - tray tooltip remains `桌面牧场`.
  - ranch settings entry can change mode, personality, and notification prefs through the existing ranch prefs bridge.
- Negative review confirms forbidden files and central grid layout were not changed.

blockers:
- Implementation is accepted for the declared M4 scope; future scope expansion needs a new dispatch.
- The Git repo is valid at `fa9e08b Import AgentPet workspace`, but the M4 worker must not stage, commit, push, reset, clean, or remove files.
- Transparent ranch pointer smoke remains partially manual because Windows capture reports `SetIsBorderRequired failed`.

next action:
- Keep this M4 implementation card summarized.
- Future ranch or control-cockpit work must open a new bounded lane and re-run the same negative checks.

summary:
- Summarized M4 implementation long-worker package; thread `019f227a-8978-7df1-8b3f-738ccdb01b18` completed and PM verified lint/build/orchestration/preflight/connector-safety plus browser settings smoke.
