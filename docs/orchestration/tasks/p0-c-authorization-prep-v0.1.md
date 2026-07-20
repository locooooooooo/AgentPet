# P0-C Authorization Readiness v0.1

[长工]#p0-c-authorization-prep@v0.1
⟦tag:v2|task|p0-c-authorization-prep-v0.1⟧
loop state: active
dispatch state: active
status: implementation_in_progress_waiting_user_authorization
priority: P0-C

## goal

Prepare a current, exact Codex P0-C read-only execution envelope and identify any technical precondition that still blocks user authorization.

## file fence

This is a read-only long-worker lane. It may inspect the repository and run existing read-only checks, but it may not write files, stage, commit, push, package, change Connector gates or execute any Agent CLI.

## required output

- Reconcile A7.1, B2, truth, safety and current P0-C task-card preconditions against the live repository.
- Produce the exact fields needed for a user decision: Codex-only connector, cwd, known read-only task, allowed read set, timeout no greater than 120 seconds, retry=0, write prohibition, shell prohibition, output limits and stop conditions.
- Report `ready_for_user_authorization` or exact blockers. Never infer authorization from this card or from local Codex discovery.

## verification

- Run `npm.cmd run orchestration:check`, `npm.cmd run orchestration:connector-safety`, `npm.cmd run lint`, `npm.cmd run build` and `git diff --check` as read-only checks where available.
- Report completed, blockers, exact envelope and unchanged external spawn count.
- Do not claim P0-C acceptance or real Agent execution.
