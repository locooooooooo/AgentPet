# Ranch Personality M5 Verification Summary

[监督]#ranch-personality@v0.1
⟦tag:v2|task|ranch-personality-v0.1⟧

objective:
- Summarize the current M5 evidence for personality tiers, notification preferences, and control-cockpit settings linkage after the ranch-only notification/UI convergence pass.
- Keep future end-to-end chatty/quiet/silent replay bounded if direct desktop observation is requested later.

dispatch state:
- Summarized verification summary.
- This card records current code, prior browser smoke, and persisted-prefs evidence only; it does not authorize connector changes, control-cockpit matrix edits, or transparent-window replay.

truth sources:
- Product source: `docs/桌面牧场需求-v0.3.md`.
- Engineering source: `docs/桌面牧场工程需求-v0.2.md`.
- Development plan: `docs/桌面牧场开发计划-v0.2.md` §7 M5.
- M4 implementation package: `docs/orchestration/tasks/ranch-m4-implementation-v0.2.md`.
- Current ranch delivery session: `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md`.
- Current PM supervision session: `docs/orchestration/sessions/daily-supervision-2026-07-02.md`.
- Current code evidence: `src/types.ts`, `electron/main.ts`, `electron/preload.ts`, `src/ranch/components/PersonalityGate.tsx`, `src/ranch/hooks/useRanchNotifications.ts`, `src/ranch/hooks/useRanchMode.ts`, `src/components/NiuMaWorkspace.tsx`.

FR coverage:
- `FR-007` personality tiers:
  - `src/types.ts` defines `RanchPersonality = 'chatty' | 'quiet' | 'silent'` and stores it inside `RanchPrefs`.
  - `electron/main.ts` seeds/normalizes `personality`, persists it, and exposes radio options for `chatty`, `quiet`, and `silent` in the ranch context menu.
  - `src/ranch/components/PersonalityGate.tsx` allows all toast types in `chatty`, only `success|warning|error` in `quiet`, and blocks all ranch toasts in `silent`.
  - `src/ranch/hooks/useRanchNotifications.ts` clears existing ranch toasts when personality becomes `silent` or bubble notifications are disabled.
- Notification preference linkage:
  - `src/types.ts` keeps `notifyPrefs.bubble`, `notifyPrefs.system`, and `notifyPrefs.cockpitBadge` in persisted `RanchPrefs`.
  - `src/ranch/hooks/useRanchNotifications.ts` gates ranch toasts and system notifications from those persisted flags.
  - `src/ranch/hooks/useRanchNotifications.ts` now limits ranch bubble output to one `1500ms` toast, preserving the v0.3 three-level UI constraint.
  - `electron/main.ts` refuses `ranch:request-notify` when `notifyPrefs.system` is false.
- Control-cockpit settings linkage:
  - `src/components/NiuMaWorkspace.tsx` reads ranch prefs through the desktop bridge and writes mode, personality, and three notification toggles through `patchRanchPrefs(...)`.
  - `docs/orchestration/sessions/daily-supervision-2026-07-02.md` records M4 browser smoke with `mode=floating`, `personality=quiet`, and `notifyPrefs.system=false` written from the control-cockpit settings entry.
  - `electron/preload.ts` exposes the ranch prefs bridge used by both ranch and control cockpit.

current state:
- This M5 personality summary is summarized.
- The control-cockpit settings entry, persisted prefs bridge, and personality/notifyPrefs gating chain are already present in code and were partially exercised in the accepted M4 browser smoke.
- No connector state or protected control-cockpit matrix state changed while preparing this summary.

blocked or pending:
- This pass did not rerun a fresh end-to-end desktop replay across all three personality tiers.
- Do not overstate direct desktop proof beyond the existing M4 browser prefs-write evidence.
- No connector accepted/enabled state, no pointer smoke, and no M4 scope expansion belongs to this card.

acceptance:
- `docs/orchestration/index.md` tracks this card.
- `docs/orchestration/status.json` keeps this role and lane summarized.
- The summarized evidence explicitly links FR-007 to control-cockpit settings and notifyPrefs without marking any connector or pointer behavior accepted.

next action:
- Keep this card summarized as the M5 personality/settings linkage evidence summary.
- If a future pass needs direct chatty/quiet/silent replay, open a fresh bounded smoke lane rather than widening this summary card.

summary:
- Summarized current FR-007 plus notifyPrefs/control-cockpit linkage evidence; no fresh end-to-end personality replay was run in this pass.
