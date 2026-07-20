# Hub Session View DockView D0 v0.1

[长工]#hub-session-dockview-d0@v0.1
⟦tag:v2|task|hub-session-dockview-d0-v0.1⟧
loop state: active
dispatch state: active
status: implementation_in_progress_awaiting_user_acceptance
priority: P0.5/D0

## goal

Advance the implemented Session View P0.5 with a bounded DockView D0 registry and persistence-neutral layout model, without reopening accepted Session truth or implementing full D1-D4 multi-window behavior.

## file fence

Allowed writes:

- `src/lib/dockViewRegistry.ts`
- `src/components/NiuMaWorkspace.tsx`
- `src/index.css`
- `scripts/check-dock-view-d0.mjs`

All other files are read-only. Preserve the protected central 4x2 cockpit grid and all Connector/Session truth boundaries.

## required behavior

- Define a deterministic workstation/module registry for Session detail, Agent Library, logs and control status.
- Keep one source of truth for selected Agent/Session identity; host process presence must not create a Session.
- Provide a bounded D0 layout projection that can serialize/restore view state without starting or stopping work.
- Keep drag/drop, saved profiles, native pop-outs, cross-window synchronization and full D1-D4 behavior explicitly out of scope.
- Preserve responsive containment and current Session/Connector evidence semantics.

## verification

- `node scripts/check-dock-view-d0.mjs`
- `npm.cmd run realtime:truth-check`
- `npm.cmd run lint`
- `npm.cmd run build`
- `git diff --check`
- No package, external execution or acceptance claim.
