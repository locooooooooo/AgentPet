# Ranch Status Script M5 Verification Summary

[监督]#ranch-status-script@v0.1
⟦tag:v2|task|ranch-status-script-v0.1⟧

objective:
- Summarize the current M5 evidence for animal identity rendering, status-script mapping, single-toast ranch status band, and system-notification code paths after the v0.3 ranch UI convergence pass.
- Keep direct desktop notification observation bounded as optional future smoke, not fake acceptance.

dispatch state:
- Summarized verification summary.
- This card records current code, browser smoke, and prior Electron evidence only; it does not authorize connector changes or desktop pointer replay.

truth sources:
- Product source: `docs/桌面牧场需求-v0.3.md`.
- Engineering source: `docs/桌面牧场工程需求-v0.2.md`.
- Development plan: `docs/桌面牧场开发计划-v0.2.md` §7 M5.
- Current ranch delivery session: `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md`.
- Current PM supervision session: `docs/orchestration/sessions/daily-supervision-2026-07-02.md`.
- Current code evidence: `src/ranch/data/agentAnimals.ts`, `src/ranch/data/statusActions.ts`, `src/ranch/components/RanchCanvas.tsx`, `src/ranch/components/Animal.tsx`, `src/ranch/RanchApp.tsx`, `src/ranch/components/StatusBand.tsx`, `src/ranch/components/NotificationToast.tsx`, `src/ranch/hooks/useRanchNotifications.ts`, `src/ranch/styles/ranch.css`, `electron/main.ts`.
- Current browser smoke: `http://127.0.0.1:5173/ranch.html` showed 8 `.animal` nodes, zero persistent `.notification-toast`, first glyph `56px`, transparent field background, and no horizontal overflow.

FR coverage:
- `FR-002` eight animals and identity readability:
  - `src/ranch/data/agentAnimals.ts` defines eight agent identities, unique emoji glyphs, display names, codenames, idle animations, and default positions.
  - `src/ranch/components/RanchCanvas.tsx` renders one `Animal` per mapped agent/runtime pair.
  - `src/ranch/components/Animal.tsx` exposes `aria-label`, `data-agent-id`, glyph, display label, and codename.
  - `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md` records browser smoke with 8 `.animal` nodes and later accessibility evidence with 8 named animal toggle buttons.
- `FR-003` status-to-animation script:
  - `src/ranch/data/statusActions.ts` maps all 14 `NiuMaStatus` values into `pose`, `motion`, `particle`, and fallback bubble text.
  - `src/ranch/components/Animal.tsx` binds pose/motion classes directly from `pickAnimalAction(...)`.
  - `src/ranch/styles/ranch.css` provides the pose/motion keyframes and accent-ring variants used by the mapped status classes.
  - Current state: code-covered for the 14-state mapping and visible class pipeline.
- `FR-004` ranch status band:
  - `src/ranch/RanchApp.tsx` mounts `StatusBand` above `RanchCanvas`.
  - `src/ranch/hooks/useRanchNotifications.ts` watches `snapshot.messages[0]`, limits the band to one toast, and clears each toast after `1500ms`.
  - `src/ranch/components/StatusBand.tsx` renders only the active message and no longer shows a persistent idle label.
  - `src/ranch/styles/ranch.css` positions the status band as one bottom-centered L2 temporary bubble over the transparent ranch field.
  - `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md` records browser smoke with `.status-band` rendered and no boot/error card.
  - Current state: code-covered and browser-evidenced for the in-ranch single-toast status band.
- `FR-006` system notification path:
  - `src/ranch/hooks/useRanchNotifications.ts` requests system notification only for `success` or `error` messages and only when `notifyPrefs.system` is enabled.
  - `electron/main.ts` rejects empty/disabled cases, checks `Notification.isSupported()`, then calls `new Notification({ title, body }).show()`.
  - Current state: code-covered; this pass did not add a fresh OS-level toast recording.

current state:
- This M5 status/script summary is summarized.
- The animal roster, 14-state action mapping, and single-toast status-band pipeline are evidenced by current code plus ranch browser/Electron verification.
- Current ranch UI was simplified to the product v0.3 L1/L2/L3 structure in `src/ranch/**`; no control-cockpit matrix files were edited by this card.
- The desktop notification branch exists and is still bounded by `notifyPrefs.system` plus Electron notification support.

blocked or pending:
- Do not treat direct OS-level notification display as newly observed in this PM pass.
- No connector enablement, no source edit, and no pointer input belongs to this card.
- If a future pass needs desktop-level toast proof, it should run as a fresh bounded smoke lane rather than widening this summarized card.

acceptance:
- `docs/orchestration/index.md` tracks this card.
- `docs/orchestration/status.json` keeps this role and lane summarized.
- This card clearly separates code/browser evidence from any future OS-notification replay.
- No connector accepted/enabled state is changed here.

next action:
- Keep this card summarized as the M5 animal/status/notification evidence summary.
- If direct Electron notification proof is requested later, open a fresh bounded smoke lane and leave connector policy unchanged.

summary:
- Summarized current FR-002/003/004/006 evidence after the single-toast ranch UI convergence pass; OS-level notification replay was not re-run.
