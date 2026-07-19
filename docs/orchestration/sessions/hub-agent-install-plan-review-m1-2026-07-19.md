# Hub M1.2 InstallPlan Review Evidence - 2026-07-19

[PM]#hub-agent-install-plan-review-m1@v0.1
⟦tag:v2|session|hub-agent-install-plan-review-m1-2026-07-19⟧

loop state: standby
dispatch state: standby
status: implemented_review_only_packaged_verified
date: 2026-07-19
priority: M1.2

## delivered

- Added a pure, renderer-safe InstallPlan review module with strict v0.1 schema checks, structured PermissionManifest and step validation, review status projection and a deterministic consent binding preview.
- Added fail-closed cancellation and Journal recovery decisions without starting an InstallRun or writing a Journal.
- Added a Kimi existing-install draft copied from the authoritative contract boundary. The projection preserves publisher/artifact/document/signature trust as unknown and keeps execution disabled.
- Added an Agent Library Plan column, a global InstallPlan review entry and a responsive review drawer covering identity, source/integrity, nine permission categories, step DAG, cancellation/recovery/Journal, open validation items and consent binding.
- Added deterministic negative fixtures and packaged Electron CDP checks; no main/preload IPC was added.

## packaged evidence

- Executable: `release/desktop-ranch-win-unpacked-20260719-210847/桌面牧场.exe`.
- Desktop viewport: `1204x795`; narrow viewport: `720x760`.
- Registered Agent Library rows: `6`; visible Kimi discovery row remains unbound when locally observed.
- Kimi InstallPlan: `draft`; execution enabled: `false`.
- Permission categories: `9`; structured steps: `3`; total declared timeout: `340s`.
- Source: `local-observation:kimi:windows:2026-07-18`; publisher: `unknown`; artifact digest: `unresolved`.
- Library table horizontal overflow: `0`; desktop Plan drawer overflow: `0`; narrow Plan drawer overflow: `0`; page/Session detail overflow: `0`.
- Library screenshot: `docs/orchestration/sessions/hub-agent-library-m1-2026-07-19.png` (`156433` bytes).
- Desktop Plan screenshot: `docs/orchestration/sessions/hub-agent-install-plan-m1-2026-07-19.png` (`129300` bytes).
- Narrow Plan screenshot: `docs/orchestration/sessions/hub-agent-install-plan-m1-mobile-2026-07-19.png` (`41933` bytes).
- CDP route: `electron-cdp-page-capture`; temporary Electron profile and process tree were cleaned by the harness.

## negative matrix evidence

- Unknown schema/field, raw shell and downloaded-script execution: rejected.
- HTTP artifact source and publisher/signature/hash conflict: rejected.
- Undeclared service effect, implicit elevation, unconfirmed PATH mutation and unrecoverable machine write: rejected.
- Credential access, automatic login, external task start and Connector gate mutation: rejected.
- Plan version/effects binding drift: prior consent invalid.
- ready cancellation: zero new normal steps; non-interruptible running cancellation: wait for safe point and preserve authorized compensation.
- Journal hash or last-known-good failure: `recovery-failed`.

## checks

- `node scripts/check-agent-install-plan.mjs`: pass.
- `npm.cmd run realtime:truth-check`: pass.
- `npm.cmd run orchestration:connector-safety`: pass; external Agent spawn remains `0` in the InstallPlan slice.
- `npm.cmd run orchestration:check`: pass before adding this card, then rerun after card registration.
- `npm.cmd run hub:contracts-check`: pass.
- `npm.cmd run lint`: pass.
- `npm.cmd run package:win`: pass.
- Packaged desktop/narrow CDP smoke: pass.
- `git diff --check`: pass.

## boundary

- This is a review-only M1.2 slice, not an accepted InstallPlan or InstallPlan executor.
- `valid-review-only` means the document passed the review gate; it never means authorized or executable.
- No install/download/elevation/credential/service/process effect occurred and no Connector policy changed.
- Kimi installed/version/Session/task truth remains unknown unless independent evidence supplies it.
- OpenClaw risk/auth, P0-C authorization, Trae Models, Qoder Headless API, two accepted Headless Adapters and the M2 dependency workflow remain separately gated.

next action:
- Preserve this gate and advance evidence acquisition or a separately authorized executor card; never reuse review status as consent.
