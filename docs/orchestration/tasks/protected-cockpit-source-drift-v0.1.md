# Protected Cockpit Source Drift Disposition

[PM]#protected-cockpit-source-drift@v0.1
⟦tag:v2|task|protected-cockpit-source-drift-v0.1⟧

loop state: summarized
dispatch state: summarized
status: closed_no_current_drift

date: 2026-07-08

objective:
- Keep current protected cockpit / selling-point source drift visible as a PM disposition item.
- Prevent accidental acceptance, formatting, reverting, or implementation routing of protected source diffs without explicit PM/user decision.
- Preserve the R0-3 dry-run boundary: this lane does not authorize Codex dry-run execution or connector machine-gate edits.

current state:
- Closed by a fresh 2026-07-16 read-only audit after the administrator authorized today's cleanup.
- `src/components/NiuMaWorkspace.tsx`, `src/components/StatusStrip.tsx`, `src/index.css`, `src/lib/agentCore.ts`, and `src/components/NiuMaAvatar.tsx` have no diff against `HEAD`.
- Targeted and repository-wide `git diff --check` pass; the historical trailing-whitespace red point no longer exists.
- No protected source line was edited, formatted, accepted, or rolled back to manufacture a cleanup.
- Evidence: `docs/orchestration/sessions/protected-cockpit-source-drift-closeout-2026-07-16.md`.

scope:
- Preserve the historical disposition and the fresh no-drift audit.
- Any future protected source drift requires a new bounded review against the then-current `HEAD`.

allowed after disposition:
- If PM/user accepts the diffs, record the acceptance evidence and rerun gates.
- If PM/user authorizes format-only repair, limit the edit to the named whitespace/format target and rerun `git diff --check`, `npm.cmd run lint`, `npm.cmd run build`, and orchestration gates.
- If PM/user authorizes rollback or a bounded implementation lane, first name the exact files and verification surface.

acceptance:
- This card is tracked by `docs/orchestration/index.md`.
- `docs/orchestration/status.json` keeps this role/lane `summarized`.
- `docs/orchestration/tasks/daily-decision-queue-2026-07-02.md` contains the PM decision queue row and coverage row for this lane.
- `docs/orchestration/tasks/daily-role-accountability-2026-07-02.md` contains the role accountability row for this lane.
- `docs/orchestration/sessions/daily-supervision-2026-07-02.md` records the W28 bounded-lane routing and preserves the no-source-edit boundary.
- No `src/**`, `electron/**`, `package.json`, Git stage/commit/push/reset/clean, connector machine-gate field, or external connector command is changed by this card.

non-goals:
- Do not edit `src/components/NiuMaWorkspace.tsx`, `src/components/StatusStrip.tsx`, `src/index.css`, `src/lib/agentCore.ts`, `src/components/NiuMaAvatar.tsx`, or any central cockpit grid / selling-point surface from this standby card.
- Do not fix trailing whitespace until PM/user explicitly chooses format-only repair or another source disposition.
- Do not edit `docs/orchestration/connectors.json`.
- Do not run Codex, Trae, Qoder, or any connector.
- Do not stage, commit, push, reset, clean, or remove files.
- Do not reopen summarized homepage-ui-design, ranch-m4, ranch-window, ranch-status-script, ranch-personality, cockpit-refactor-p0, or pointer-smoke lanes from this card.

next action:
- Preserve the clean protected-source baseline.
- Open a fresh bounded lane only if a future diff names exact files and verification surfaces.

summary:
- Closed with no current protected-source drift and no source edit.
