# Homepage UI P0 · H0-4 Evidence

[PM]#homepage-ui-p0@v0.1
⟦tag:v2|session|homepage-ui-p0-c0-6-style-2026-07-07⟧

loop state: standby
dispatch state: accepted

date: 2026-07-07
accepted design: C · 华丽
implementation scope: H0-2 HomePage + H0-3 visual polish + H0-4 protected-file audit

runtime:
- local dev server: `http://127.0.0.1:5173/`
- Electron dev process: `npm.cmd run dev`, parent PID `49852`
- Vite log: `VITE v6.4.3 ready in 224 ms`

verification:
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.
- `npm.cmd run orchestration:check` passed; referenced cards: 61.
- `npm.cmd run orchestration:preflight` passed.
- `npm.cmd run orchestration:connector-safety` passed.
- CDP smoke passed with structural selectors:
  - first screen `.homepage-shell` present.
  - `.homepage-animal-card` count = 8.
  - `.homepage-metric-card` count = 4.
  - first animal click writes ranch prefs `selectedAgentId=codex`.
  - `.homepage-cockpit-entry button` click enters `.workspace-shell`.
  - `.header-actions > button.safe-status` click returns to `.homepage-shell`.

visual evidence:
- `docs/orchestration/sessions/homepage-ui-p0-visual-2026-07-07-1920x1080.png`
- `docs/orchestration/sessions/homepage-ui-p0-visual-2026-07-07-1366x768.png`
- `docs/orchestration/sessions/homepage-ui-p0-visual-2026-07-07-hover.png`

protected-file audit:
- `git diff -- src/components/NiuMaAvatar.tsx` = empty.
- `git diff -- src/index.css` = empty.
- `git diff -- src/lib/agentCore.ts` = empty.
- `git diff -- src/ranch electron docs/orchestration/connectors.json package.json icon` = empty.
- `git diff -- src/components/NiuMaWorkspace.tsx` = only Home icon import, optional `onReturnHome` prop, and one `返回首页` button in `.header-actions`.

accepted:
- Startup screen is the new HomePage.
- C · 华丽 visual direction is implemented with full-screen dark/glow card layout.
- 8 animal overview cards render.
- Control cockpit entry works.
- Return-home path works.
- README documents the startup flow.
- `docs/桌面牧场需求-v0.3.md` documents the HomePage / landing 3-level information hierarchy.
- Connector execution remains disabled and status-only.
- C0-6 protected selling-point files remain untouched.

notes:
- No `git add`, commit, push, reset, clean, or connector execution was performed.
- Electron transparent ranch window still exists separately from the HomePage/cockpit flow and was not modified.
