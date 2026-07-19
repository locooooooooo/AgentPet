# Hub M1.3 Agent Version Evidence v0.1

[PM]#hub-agent-version-evidence-m1@v0.1
⟦tag:v2|task|hub-agent-version-evidence-m1-v0.1⟧

loop state: summarized
dispatch state: summarized
status: implemented_live_packaged_verified
date: 2026-07-19
priority: M1.3

## goal

Replace Agent Library's fixed unknown versions with independent, read-only Windows version evidence for at least three lifecycle candidates, without executing an Agent CLI or exposing paths and commands to the renderer.

## bounded implementation

Allowed files:

- `src/types.ts`
- `electron/agentHostDiscovery.ts`
- `src/lib/agentLibrary.ts`
- `src/components/NiuMaWorkspace.tsx`
- `scripts/check-agent-host-discovery.mjs`
- `scripts/check-agent-library.mjs`
- `scripts/smoke-packaged-agent-lifecycle.mjs`

The fixed Windows host probe may inspect `FileVersionInfo` for exact primary process names and exact `DisplayName` matches under fixed uninstall registry roots. It publishes only version value, evidence source, status and observed-at time.

Explicit non-goals:

- No Agent `--version` command, CLI spawn, script execution, package download or install action.
- No executable path, registry path, command line, window title, credential, Session or task content exposed to the renderer.
- No fuzzy process/product matching and no silent version normalization.
- No support-level promotion from a version fact; installed/running/Session/Connector evidence remain independent.
- No Connector policy or InstallPlan execution change.

## acceptance

- Exact primary `FileVersionInfo` or exact uninstall `DisplayName` can produce `verified` version evidence.
- Process metadata wins only when registry and process evidence agree on one version.
- Multiple distinct versions produce `conflict / unknown`; product identity mismatch produces `identity-mismatch / unknown`; invalid or missing versions remain `not-observed / unknown`.
- Kimi primary version may appear on the unbound discovery row but does not grant installed, bound, Session or Connector state.
- Packaged Agent Library exposes at least three registered lifecycle candidate versions with explicit source and zero table overflow.
- Existing realtime truth, InstallPlan review, Session and Connector safety gates remain green with external Agent spawn `0`.

## verification

- Live sanitized probe: Trae `2.3.55932`, WorkBuddy `5.2.5`, Qoder `1.15.1`, MiniMax `3.0.51.82`, Kimi `3.1.2`; OpenClaw unknown.
- `npm.cmd run realtime:truth-check`: pass, including exact version, conflict and identity mismatch fixtures.
- `npm.cmd run lint`: pass.
- `npm.cmd run build`: pass.
- `npm.cmd run package:win`: pass; packaged executable `release/desktop-ranch-win-unpacked-20260719-212416/桌面牧场.exe`.
- Packaged CDP smoke: at least 3 registered verified versions, Library overflow `0`, existing Plan review and Session truth unchanged.
- `git diff --check`: pass.

## residual gap

This closes independent version evidence on the current Windows host, not full lifecycle execution. Full M1 still requires an accepted executable InstallPlan, explicit authorization, install/launch/recheck/recovery handling and three independent rollback closures. Qoder remains rejected as a Headless Adapter, Trae remains blocked by Models/fresh authorization, and M2 remains unopened.

next action:
- Preserve the version evidence boundary. Do not use a version fact to infer Connector readiness; advance only through a separately fenced lifecycle execution or Headless Adapter acceptance card.

evidence:
- `docs/orchestration/sessions/hub-agent-version-evidence-m1-2026-07-19.md`
