# Hub M1.3 Agent Version Evidence - 2026-07-19

[PM]#hub-agent-version-evidence-m1@v0.1
⟦tag:v2|session|hub-agent-version-evidence-m1-2026-07-19⟧

loop state: standby
dispatch state: standby
status: implemented_live_packaged_verified
date: 2026-07-19
priority: M1.3

## delivered

- Added bounded `AgentHostVersionEvidence` with `value / source / status / observedAt` only.
- Extended the fixed Windows host probe to inspect exact primary process `FileVersionInfo` and exact uninstall registry `DisplayName` records.
- Added identity alias checks, strict version shape, process/registry agreement handling, deterministic source preference and conflict fail-closed behavior.
- Wired verified lifecycle and unbound discovery versions into Agent Library; unknown/conflict evidence still renders `unknown` with its source.
- Kept every existing support, installed, running, Session, task and Connector boundary independent.

## live evidence

Sanitized host snapshot at `2026-07-19T13:19:44.183Z`:

| Agent | Version | Source | Status | Boundary |
| --- | --- | --- | --- | --- |
| Trae | `2.3.55932` | `windows-process-file-version` | verified | lifecycle candidate only |
| WorkBuddy | `5.2.5` | `windows-process-file-version` | verified | lifecycle candidate only |
| Qoder | `1.15.1` | `windows-process-file-version` | verified | Headless remains rejected |
| MiniMax | `3.0.51.82` | `windows-process-file-version` | verified | lifecycle candidate only |
| Kimi | `3.1.2` | `windows-process-file-version` | verified | unbound discovery; installed remains unknown |
| OpenClaw | unknown | `not-observed` | unknown | risk/auth remains user-controlled |

The diagnostic output contained no executable path, registry path, command line, window title, credential, Session ID or task data.

## packaged evidence

- Executable: `release/desktop-ranch-win-unpacked-20260719-212416/桌面牧场.exe`.
- Viewport: `1204x795`.
- Registered rows: `6`; registered verified versions: `4`.
- Registered version values: Codex unknown, MiniMax `3.0.51.82`, OpenClaw unknown, Qoder `1.15.1`, Trae `2.3.55932`, WorkBuddy `5.2.5`.
- Unbound Kimi row: `3.1.2`, `detected`, installed unknown, Connector unregistered.
- Library table overflow: `0`; page/Session detail/Plan drawer overflow remain `0`.
- Screenshot: `docs/orchestration/sessions/hub-agent-version-evidence-m1-2026-07-19.png` (`155767` bytes, `electron-cdp-page-capture`).

## negative evidence

- Same Agent with process `1.0.0` and registry `1.1.0`: `conflict`, value unknown.
- Qoder version record carrying `Qoder Helper` identity: `identity-mismatch`, value unknown.
- Kimi helper identity cannot establish a Kimi primary version.
- Invalid/missing version shape remains unknown; no silent cleanup or coercion.
- Source scan verifies no Agent `--version` execution and no external Agent executable spawn from discovery.

## checks

- `node scripts/check-agent-host-discovery.mjs`: pass.
- `node scripts/check-agent-library.mjs`: pass.
- `npm.cmd run realtime:truth-check`: pass.
- `npm.cmd run lint`: pass.
- `npm.cmd run build`: pass.
- `npm.cmd run package:win`: pass.
- Packaged CDP smoke: pass with 4 registered verified versions and zero Library overflow.
- `git diff --check`: pass.

## boundary

- Version evidence does not prove installed, running, online, active task, connectable or coordinatable state.
- This slice does not implement InstallPlan execution or an InstallRunJournal.
- No main/preload API was added; the existing host snapshot carries the bounded evidence.
- OpenClaw risk/auth, P0-C authorization, Trae Models, Qoder Headless API and the two-Adapter M2 workflow remain separate gates.

next action:
- Keep M1.3 accepted and open the next separately fenced lifecycle execution or Adapter acceptance loop without weakening evidence separation.
