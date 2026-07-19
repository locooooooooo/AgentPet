# Hub M1.2 InstallPlan Review Gate v0.1

[PM]#hub-agent-install-plan-review-m1@v0.1
⟦tag:v2|task|hub-agent-install-plan-review-m1-v0.1⟧

loop state: summarized
dispatch state: summarized
status: implemented_review_only_packaged_verified
date: 2026-07-19
priority: M1.2

## goal

Deliver a fail-closed InstallPlan review gate inside Agent Library without creating an installer or an execution path. The gate must make source, publisher, artifact integrity, permissions, structured steps, cancellation, recovery, Journal policy and consent binding visible before any future execution work can be considered.

## bounded implementation

Allowed product files:

- `src/lib/agentInstallPlan.ts`
- `src/components/NiuMaWorkspace.tsx`
- `src/index.css`
- `scripts/check-agent-install-plan.mjs`
- `scripts/smoke-packaged-agent-lifecycle.mjs`
- `package.json`

The only visible plan is the contract-owned Kimi Windows existing-install draft. It remains `draft` because publisher, artifact digest, document digest and signatures are not verified. The renderer may display `unavailable / draft / valid-review-only / rejected`; none of these states grants execution.

Explicit non-goals:

- No downloader, installer, package manager, elevation prompt, credential access, service mutation or external Agent process spawn.
- No main/preload IPC change, Connector policy change, authorization grant or automatic consent.
- No installed/version/online/Session/task evidence derived from the Plan review.
- No InstallRunJournal persistence or InstallPlan executor.
- No Headless Adapter acceptance, M2 workflow claim, OpenClaw risk acceptance or Trae/Qoder gate change.

## acceptance

- Strict schema/version and unknown-field checks reject drift and misspelled fields.
- Raw shell/cmd/PowerShell, HTTP artifact sources, signature/hash conflicts, undeclared effects, implicit elevation, unconfirmed PATH/profile/service changes and post-install login/task/Connector mutations fail closed.
- Every PermissionManifest category is visible: network, elevation, filesystem reads/writes, PATH, shell profile, services, process launches and credential access.
- Steps are structured, acyclic, timed, cancellable, idempotent and auditable; required method steps and declared effect scopes are checked.
- Consent binds plan ID/version, manifest range, artifact digests and effects fingerprint; drift requires fresh consent.
- queued/ready cancellation permits zero new normal steps; non-interruptible cancellation waits for a safe point; damaged Journal evidence resolves to `recovery-failed`.
- The UI has no enabled execution control and adds no IPC or external process action.
- Packaged Electron evidence covers 1204x795 and 720x760 viewports with zero drawer/table/page horizontal overflow.

## verification

- `node scripts/check-agent-install-plan.mjs`: pass.
- `npm.cmd run realtime:truth-check`: pass, including InstallPlan negative fixtures and existing truth boundaries.
- `npm.cmd run orchestration:connector-safety`: pass; external Agent CLI execution remains absent.
- `npm.cmd run orchestration:check`: pass with all tracked cards.
- `npm.cmd run hub:contracts-check`: pass.
- `npm.cmd run lint`: pass.
- `npm.cmd run package:win`: pass; packaged executable `release/desktop-ranch-win-unpacked-20260719-210847/桌面牧场.exe`.
- Packaged CDP smoke: pass for Library, desktop Plan drawer, narrow Plan drawer, Session truth and zero overflow.
- `git diff --check`: pass.

## residual gap

This closes only the M1.2 review gate. It does not accept an installable Plan and does not implement InstallRunJournal or execution. Kimi remains draft/unknown. Full M1 still requires trusted publisher/artifact/version evidence, explicit user authorization, an executor with recovery, and three independent lifecycle rollback closures. M2 still requires two accepted Headless Adapters and a real cancellable audited dependency workflow.

next action:
- Keep InstallPlan execution closed. Next advance the smallest evidence-only lifecycle gap that can be verified without user credentials or Connector enablement; do not treat `valid-review-only` as machine authorization.

evidence:
- `docs/orchestration/sessions/hub-agent-install-plan-review-m1-2026-07-19.md`
