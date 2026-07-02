# Ranch M4 Implementation Dispatch Package

[短工]#ranch-m4-implementation@v0.2
⟦tag:v2|task|ranch-m4-implementation-v0.2⟧

objective:
- Implement Ranch M4 rename + control-cockpit linkage only after PM/user explicitly dispatches implementation.
- Preserve the current M3 ranch interaction baseline and keep connector execution disabled.

dispatch state:
- Standby. This is a future implementation package, not an active implementation lane.
- Do not edit files from this package until PM/user explicitly dispatches M4 implementation.

truth sources:
- Requirements readiness: `docs/orchestration/tasks/ranch-m4-requirements-v0.2.md`.
- Product source: `docs/桌面牧场需求-v0.3.md`.
- Engineering source: `docs/桌面牧场工程需求-v0.2.md`.
- Development plan: `docs/桌面牧场开发计划-v0.2.md` §6 M4.

current M4 preflight:
- Already aligned: `electron/main.ts` has main window title `桌面牧场 · 控制舱`, ranch window title `桌面牧场`, and tray tooltip `桌面牧场`.
- Already aligned: `ranch.html` has `<title>桌面牧场</title>`.
- Pending: `package.json` still describes `多 Agent 牛马核心部门桌面版`.
- Pending: `README.md` still starts with `# 多 Agent 牛马核心部门`.
- Pending: `src/App.tsx` boot screens still show `多 Agent 牛马核心部门`.
- Pending: control cockpit has no compact app-header ranch settings entry yet.

future write scope:
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
- Implementation is not authorized yet.
- Local Git metadata is still invalid, so future implementation must not rely on Git diff until repair is explicitly authorized and completed.
- Transparent ranch pointer smoke remains partially manual because Windows capture reports `SetIsBorderRequired failed`.

next action:
- Wait for PM/user explicit M4 implementation dispatch.
- On dispatch, keep the worker short-scoped and require callback evidence before acceptance.

summary:
- Standby implementation dispatch package; no implementation started.
