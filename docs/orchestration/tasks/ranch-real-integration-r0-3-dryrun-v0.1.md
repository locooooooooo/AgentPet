# ranch-real-integration-r0-3-dryrun-v0.1

[PM]#ranch-real-integration-r0-3-dryrun@v0.1
⟦tag:v2|task|ranch-real-integration-r0-3-dryrun-v0.1⟧
loop state: standby
dispatch state: standby
status: standby

date: 2026-07-07
parent task: `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`
source decision: P0-2 branch ②, keep R0-3 deferred but open a controlled Codex dry-run evidence lane.

objective:
- Move R0-3 from the 2026-07-04 no-go/deferred state into a controlled dry-run evidence lane.
- Keep Codex `draft / pending / enabled=false`; keep Trae/Qoder `placeholder / command-empty`.
- Collect future Codex controlled dry-run evidence without touching the connector machine gate.

current state:
- Standby only. No Codex dry-run command has been executed from this task.
- `docs/orchestration/connectors.json` remains the current machine-gate source of truth.
- This card is preparation for acceptance-grade input; it is not PM acceptance to enable any connector.

scope:
- Codex only.
- Use an isolated workspace cwd before any future command execution.
- Archive future evidence under `docs/orchestration/sessions/codex-dryrun-2026-07-XX.{json,png,md}`.
- Keep all execution output out of `src/`, `electron/`, and product runtime files.

activation gate:
- P0-2 branch ② is the selected route.
- User gives a second explicit confirmation for the dry-run timing.
- The future run starts from an isolated cwd and names its log/archive path before execution.

future dry-run command shape:

```powershell
codex --output-format json --quiet "<prompt>"
```

future acceptance:
- At least 1 Codex non-interactive JSON call exits 0.
- At least 1 `.json`, `.png`, or `.md` evidence artifact is archived under `docs/orchestration/sessions/`.
- No connector machine-gate fields are changed: `approvalStatus`, `enabledByDefault`, and `command` stay at their pre-run values.
- No Trae or Qoder command is invoked.
- `npm.cmd run orchestration:check`, `npm.cmd run orchestration:preflight`, and `npm.cmd run orchestration:connector-safety` all pass after evidence is archived.

standby acceptance for this card:
- This task card exists and is tracked by `docs/orchestration/index.md`.
- The parent R0-3 task section points to this standby lane.
- The weekly requirements card records that branch ② has a standby evidence lane, not an executed dry-run.
- No dry-run command, external connector command, or connector machine-gate edit is performed by card creation.

non-goals:
- Do not edit `docs/orchestration/connectors.json`.
- Do not set `approvalStatus` to `accepted`.
- Do not set `enabledByDefault` to `true`.
- Do not change any connector `command`.
- Do not invoke Trae or Qoder.
- Do not start v0.4 implementation.
- Do not dispatch long-worker work from this card.
- Do not modify `src/**`, `electron/**`, `package.json`, `icon/**`, or protected cockpit/ranch UI surfaces.

next action:
- Wait for user second confirmation of dry-run timing before executing anything.
- When activated later, run the Codex JSON dry-run from an isolated cwd, archive evidence, then run `orchestration:check`, `orchestration:preflight`, and `orchestration:connector-safety`.
