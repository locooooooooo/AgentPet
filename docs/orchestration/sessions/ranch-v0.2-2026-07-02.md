# Ranch v0.2 Daily Control Session

[PM]#ranch-v0.2-daily-control@v0.2
⟦tag:v2|session|ranch-v0.2-2026-07-02⟧

loop state: summarized
dispatch state: summarized

completed:
- Collected prior-session handoff and opened role lanes for today's ranch v0.2 push.
- `[长工]#ranch-m1-m2-correction@v0.2` corrected the M1/M2 implementation drift:
  - `src/ranch/RanchApp.tsx` now renders `StatusBand` and `RanchCanvas`.
  - `RanchMode` is now `desktop | floating`.
  - default ranch prefs are now `640x360`, right-bottom `80px`, default `desktop`.
  - desktop mouse passthrough is exposed through the ranch preload bridge.
- `[长工]#ranch-m3-plan@v0.2` produced a read-only M3 ownership plan and confirmed M3 must wait for M1/M2 acceptance.
- `[监督]#ranch-v0.2-audit@v0.2` produced a pre-correction audit; its drift findings were used to drive the correction lane and are superseded by current worktree evidence.
- Main thread verification after correction:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.
  - `npm.cmd run orchestration:check` passed with `Referenced cards: 15`.
  - browser smoke against `http://127.0.0.1:5174/ranch.html` passed with 8 `.animal` nodes, `.ranch-canvas`, `.status-band`, no boot/error card, and no console warn/error.
- Main thread Electron smoke after correction:
  - `%APPDATA%\multi-agent-niuma` write probe passed.
  - `npm.cmd run dev` launched Electron without the previous EPERM blocker.
  - window enumeration showed `桌面牧场` and `多 Agent 牛马核心部门`.
  - legacy default prefs migrated from `floating + 720x320` to `desktop + 640x360 + right-bottom 80px`.
- `[长工]#ranch-m1-m2-correction@v0.2` added legacy-default prefs migration in `electron/main.ts` and `src/lib/desktopClient.ts`; main thread reran `lint`, `build`, and `orchestration:check` successfully.
- M1/M2 correction is accepted for M3 entry with a residual visual-capture risk: Windows helper screenshot capture failed with `SetIsBorderRequired failed: 不支持此接口 (0x80004002)`, so visual proof is browser smoke plus Electron window/prefs evidence.
- M3 implementation was dispatched to two owners:
  - `[长工]#m3-main-bridge@v0.2`: `019f20c4-0770-7101-af4d-670a7ed18d2f`
  - `[长工]#m3-ranch-entry@v0.2`: `019f20c4-211a-7c23-b55c-66d4fcd632f6`
- Git management was dispatched to `[长工]#git-manager@AgentPet`: `019f20e4-0b2e-7fa2-9553-ae0ec4dee6d2`, targeting `https://github.com/locooooooooo/AgentPet.git`.
- `[长工]#m3-main-bridge@v0.2` completed the main/preload/types/browser fallback half and reported `lint`, `build`, and `orchestration:check` passing; main thread reran the same three checks successfully.
- `[长工]#m3-ranch-entry@v0.2` completed the renderer half:
  - `src/ranch/RanchApp.tsx` delegates double-click, right-click, floating drag and desktop passthrough hot zones.
  - `src/ranch/components/Animal.tsx` exposes `data-agent-id` and drag exclusion markers.
  - `src/ranch/hooks/useDockAndDrag.ts` implements floating bounds updates, edge preview and dock persistence.
  - `src/ranch/hooks/useRanchMode.ts` returns structured mode flags.
  - `src/ranch/styles/ranch.css` adds floating drag and dock-preview styles.
- Main thread verification after M3 renderer completion:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.
  - `npm.cmd run orchestration:check` passed with `Referenced cards: 16`.
  - `npm.cmd run dev` launched Electron windows `桌面牧场` and `桌面牧场 · 控制舱`.
  - Electron accessibility evidence for `桌面牧场` showed `Desktop Ranch`, `桌面牧场动物区`, and 8 animal toggle buttons: Codex, Trae, Qoder, MiniMax, WorkBuddy, OpenClaw, OpenCCode, Hermes.
- `[长工]#git-manager@AgentPet` completed read-only Git diagnosis:
  - changed files: none.
  - local `.git` exists but is an empty unusable directory; Git reports `fatal: not a git repository`.
  - remote `https://github.com/locooooooooo/AgentPet.git` exists, auth is available for `locooooooooo`, viewer permission is ADMIN, default branch is configured as `main`, and the remote has no refs/first commit yet.
  - no `git init`, remote write, commit, push, reset or clean was executed.

incomplete:
- Full desktop visual/click-through/right-click/drag smoke remains partially automated only. Windows capture for the transparent Electron ranch window still fails with `SetIsBorderRequired failed: 不支持此接口 (0x80004002)`, and the Computer Use input layer requires a fresh screenshot state before click/right-click/drag input. Code chain and accessibility rendering are verified; real pointer smoke should be rerun manually or with another capture route.
- Git repair is not started. The safe next Git lane still needs explicit same-message confirmation before `git init -b main`, remote binding, `.gitignore` edits, staging, commit or push.

blockers:
- External connector execution remains disabled and outside today's ranch implementation lane.
- Control-cockpit selling-point files remain locked unless the user explicitly approves M4 or a separate control-cockpit lane.

next action:
- PM can accept M3 code gates as passed, with the remaining pointer-smoke caveat above.
- If the user explicitly confirms Git repair, run the minimal Git metadata lane: `git init -b main` -> `git remote add origin https://github.com/locooooooooo/AgentPet.git` -> `git fetch origin` -> `git status --ignored --short`, then stop for staging review.
- Do not touch `src/components/NiuMaAvatar.tsx`, the central 4x2 control-cockpit grid, `src/index.css`, `src/lib/agentCore.ts`, or `icon/**` without explicit approval.

evidence:
- correction thread: `019f20a7-371b-7bf1-9e07-e80caf6551dc`
- M3 plan thread: `019f20a7-43b2-7f70-92a3-4d49a4c1fe14`
- audit thread: `019f20a7-4d03-7da2-93d5-77e4468569ba`
- M3 main-bridge thread: `019f20c4-0770-7101-af4d-670a7ed18d2f`
- M3 ranch-entry thread: `019f20c4-211a-7c23-b55c-66d4fcd632f6`
- Git manager thread: `019f20e4-0b2e-7fa2-9553-ae0ec4dee6d2`
- current code evidence: `src/ranch/RanchApp.tsx`, `src/ranch/components/Animal.tsx`, `src/ranch/hooks/useDockAndDrag.ts`, `src/ranch/hooks/useRanchMode.ts`, `src/ranch/styles/ranch.css`, `src/types.ts`, `electron/main.ts`, `electron/preload.ts`, `src/lib/desktopClient.ts`, `src/ranch/hooks/useRanchNotifications.ts`
