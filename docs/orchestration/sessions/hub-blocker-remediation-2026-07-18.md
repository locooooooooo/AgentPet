# Hub Blocker Remediation - 2026-07-18

[PM]#hub-blocker-remediation@v0.1
⟦tag:v2|session|hub-blocker-remediation-2026-07-18⟧

loop state: standby
dispatch state: standby
status: implemented_pending_external_acceptance
date: 2026-07-18
priority: P0/R0

## closed implementation blockers

- Qoder fixed AppID action was clicked in the latest packaged Electron and returned focus in `192.7ms`; stopped->launch mapping remains fixture-verified without forcibly terminating the user's running Qoder.
- OpenClaw “安装服务” was clicked through the packaged Hub and returned `official-wizard-started`; an independent visible `openclaw onboard --install-daemon` terminal remains open for user risk/auth input.
- Real packaged Electron screenshot captured through CDP `Page.captureScreenshot`: `docs/orchestration/sessions/hub-agent-lifecycle-p0-electron-2026-07-18.png`, `225990` bytes; page/detail/Session horizontal overflow `0`, visual review passed.
- `HubTheme` and `HubSoundPack` canonical R0 contracts now exist with versioning, fail-closed compatibility, integrity, provenance/license, valid/invalid examples, preview isolation, LKG rollback and complete negative matrices.
- `npm.cmd run hub:contracts-check` passes.

## external acceptance still required

- OpenClaw Gateway is not installed until the user accepts the visible official risk prompt and completes authentication; code must not do this automatically.
- Theme/SoundPack automated checks and the 2026-07-19 independent exact-file review pass at the contract boundary; broader R0 acceptance still requires product-input and full-UI-truth reconciliation.
- P0-C remains unauthorized because the current user message does not confirm cwd, exact read-only task, timeout, allowed read set, write prohibition and stop conditions required by its hard precondition.
- Connector machine gates remain unchanged and disabled.

## evidence

- Package: `release/desktop-ranch-win-unpacked-20260718-185300/桌面牧场.exe`.
- Screenshot route: `electron-cdp-page-capture`; Windows `SetIsBorderRequired` was not invoked.
- OpenClaw action smoke: `official-wizard-started`; standalone visible terminal PID `40732`.
- Contract checker: theme valid + two invalid, sound valid + two invalid, HT-01~12 and HS-01~15 complete.
- Exact-file review: `docs/orchestration/sessions/hub-content-contract-review-2026-07-19.md`; R3 theme/sound implementation remains outside this acceptance.
