# Ranch Window M5 Verification Summary

[监督]#ranch-window@v0.1
⟦tag:v2|task|ranch-window-v0.1⟧

objective:
- Summarize the current M5 evidence for ranch window lifecycle, cockpit summon, mode switching, floating dock behavior, and fence/pointer boundaries without reopening implementation.
- Keep the remaining transparent-window pointer-smoke risk explicitly delegated to the existing standby verification packages.

dispatch state:
- Summarized verification summary.
- This card records current code, session, and command evidence only; it does not authorize pointer input, Electron relaunch, connector changes, or source edits.

truth sources:
- Product source: `docs/桌面牧场需求-v0.3.md`.
- Engineering source: `docs/桌面牧场工程需求-v0.2.md`.
- Development plan: `docs/桌面牧场开发计划-v0.2.md` §7 M5.
- Current ranch delivery session: `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md`.
- Current PM supervision session: `docs/orchestration/sessions/daily-supervision-2026-07-02.md`.
- Existing pointer packages: `docs/orchestration/tasks/ranch-pointer-smoke-v0.2.md`, `docs/orchestration/tasks/ranch-pointer-smoke-manual-evidence-v0.2.md`.
- Current code evidence: `electron/main.ts`, `src/ranch/RanchApp.tsx`, `src/ranch/hooks/useDockAndDrag.ts`, `src/ranch/components/RanchCanvas.tsx`, `src/ranch/styles/ranch.css`, `src/lib/desktopClient.ts`.
- Current browser smoke: `http://127.0.0.1:5173/ranch.html` showed 8 `.animal` nodes, 3 `.ranch-action-button` nodes, zero `.selected-overlay`, zero persistent `.notification-toast`, transparent field background, first glyph `56px`, and no horizontal overflow.

FR coverage:
- `FR-001` ranch window lifecycle:
  - `electron/main.ts` seeds `mode: 'desktop'`, `640x360`, right-bottom `80px`, and persisted notify prefs through `createRanchSeedPrefs()` plus `loadRanchPrefs()`.
  - `electron/main.ts` applies bounds and `screen-saver` always-on-top behavior through `applyRanchPrefsToWindow()` and `applyRanchMode()`.
  - `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md` records Electron launch, both windows visible, and legacy default migration to `desktop + 640x360 + right-bottom 80px`.
  - Current state: code-covered and Electron/prefs-evidenced; no new transparent-window manual capture was added in this pass.
- `FR-005` summon control cockpit:
  - `src/ranch/RanchApp.tsx` routes animal double-click to `api.ranch.openCockpit()` and unread reset.
  - `electron/main.ts` exposes `ranch:open-cockpit` and a ranch context menu containing `召唤控制舱` plus `设置`.
  - Current state: code-covered and prior Electron/accessibility evidence exists; direct pointer replay remains part of the dedicated pointer-smoke packages.
- `FR-008` desktop widget vs floating mode:
  - `electron/main.ts` switches `screen-saver` vs `floating`, focusability, and mouse passthrough through `applyRanchMode()` plus `setRanchMousePassthrough()`.
  - `src/ranch/RanchApp.tsx` keeps passthrough enabled in desktop mode except over `.animal`, `.ranch-actions`, and `.ranch-action-button`, so empty ranch field area is no longer treated as an interactive hot zone by the renderer selector.
  - Current state: mode contract and passthrough chain are code-covered and the renderer hot-zone selector has been tightened toward the FR-008.1 outside-hot-zone click-through expectation; direct desktop click-through observation still belongs to manual pointer smoke.
- `FR-009` floating drag and edge docking:
  - `src/ranch/hooks/useDockAndDrag.ts` updates bounds live, holds near edge for `1000ms`, and persists `dockedEdge`.
  - `src/ranch/styles/ranch.css` includes dock-preview classes for left/right/top/bottom states.
  - Current state: code-covered and previously summarized in `ranch-v0.2-2026-07-02`; direct drag replay still awaits a transparent-window-capable route.
- `FR-011` fence and pointer boundary:
  - `src/ranch/components/RanchCanvas.tsx` renders `.ranch-fence`, four hover-only `.ranch-corner` markers, and the fenced field surface.
  - `src/ranch/styles/ranch.css` keeps the fence as a weak hairline over a transparent field, exposes desktop/floating shell states, and removes the prior right-side `SelectedOverlay` detail panel.
  - Current state: fence rendering is present in code; outside-fence click-through and transparent pointer behavior are still pending direct manual evidence.
- v0.3 three-level UI convergence:
  - `src/ranch/RanchApp.tsx` adds 3 L3 icon buttons (`召唤控制舱`, `打开设置`, `切换模式`) under `.ranch-actions.is-hover-only`.
  - `src/ranch/styles/ranch.css` keeps `.ranch-actions` opacity `0` by default and only reveals it through `.ranch-shell:hover` / `:focus-within`.
  - Browser DOM smoke confirmed `actionButtonCount=3`, `actionsDefaultOpacity=0`, `selectedOverlayCount=0`, `fieldBackground=none`, and no overflow.

current state:
- This M5 window summary is summarized.
- Existing M3/M4 code evidence is sufficient to keep the window contract documented without reopening implementation.
- Current ranch UI has been converged to the v0.3 L1/L2/L3 structure in `src/ranch/**` only; the protected control-cockpit matrix was not touched.
- Transparent pointer smoke is not manually accepted here and remains owned by `ranch-pointer-smoke-v0.2` and `ranch-pointer-smoke-manual-evidence-v0.2`.

blocked or pending:
- Do not mark `FR-001`, `FR-008`, or `FR-011` pointer behavior accepted from code/browser/accessibility evidence alone.
- The remaining manual blocker is unchanged: transparent-window capture still needs a route that avoids `SetIsBorderRequired failed`.
- This follow-up has static/build evidence for the tightened hot-zone selector only; the in-app browser re-smoke was blocked by browser URL policy and no alternate browser/CDP route was used.
- No connector state, `enabledByDefault`, or `approvalStatus` change belongs to this card.

acceptance:
- `docs/orchestration/index.md` tracks this card.
- `docs/orchestration/status.json` keeps this role and lane summarized.
- Residual pointer-smoke risk is explicitly delegated to the existing standby pointer packages.
- This card does not mark any connector accepted/enabled and does not supersede the existing pointer-smoke standby lanes.

next action:
- Keep this card summarized as the M5 window evidence summary.
- Use `ranch-pointer-smoke-v0.2` plus `ranch-pointer-smoke-manual-evidence-v0.2` for any future direct transparent-window replay.

summary:
- Summarized current FR-001/005/008/009/011 evidence, including the tightened desktop hot-zone selector; manual transparent pointer smoke remains pending in dedicated standby packages.
