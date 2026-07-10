# Protected Cockpit Source Drift Disposition

[PM]#protected-cockpit-source-drift@v0.1
⟦tag:v2|task|protected-cockpit-source-drift-v0.1⟧

loop state: standby
dispatch state: standby
status: standby

date: 2026-07-08

objective:
- Keep current protected cockpit / selling-point source drift visible as a PM disposition item.
- Prevent accidental acceptance, formatting, reverting, or implementation routing of protected source diffs without explicit PM/user decision.
- Preserve the R0-3 dry-run boundary: this lane does not authorize Codex dry-run execution or connector machine-gate edits.

current state:
- Standby only.
- 2026-07-10 administrator disposition selected option ④: route the registered trailing-whitespace drift to a W28 bounded lane.
- This disposition is routing only. No protected source edit, format-only repair, acceptance, or rollback is performed in W27.
- A supervision pass observed current diffs in protected/shared source surfaces including `src/components/NiuMaWorkspace.tsx`, `src/components/StatusStrip.tsx`, `src/index.css`, and `src/lib/agentCore.ts`.
- `git diff --check` currently reports trailing whitespace in `src/components/NiuMaWorkspace.tsx`; that remains an explicit red point rather than an authorized formatting fix.

scope:
- PM disposition tracking only.
- Read-only diff review may be performed before a decision.
- Any future source edit, format-only repair, rollback, or bounded implementation lane needs explicit PM/user authorization.

allowed after disposition:
- If PM/user accepts the diffs, record the acceptance evidence and rerun gates.
- If PM/user authorizes format-only repair, limit the edit to the named whitespace/format target and rerun `git diff --check`, `npm.cmd run lint`, `npm.cmd run build`, and orchestration gates.
- If PM/user authorizes rollback or a bounded implementation lane, first name the exact files and verification surface.

acceptance:
- This card is tracked by `docs/orchestration/index.md`.
- `docs/orchestration/status.json` keeps this role/lane `standby`.
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
- Keep this lane standby through W27 closeout.
- In W28, open a fresh bounded lane naming the exact whitespace rows and verification surface before any source edit.

summary:
- Administrator selected W28 bounded routing; no source edit, connector execution, or Git write is authorized by this disposition.
