# AgentPet Git Repair Dispatch Package

[短工]#git-repair-agentpet@v0.1
⟦tag:v2|task|git-repair-agentpet-v0.1⟧

loop state: summarized
dispatch state: summarized
status: historical_repair_completed

objective:
- Preserve the historical Git metadata repair boundary and its original safety constraints.
- Record that the authorized import/push completed and that this repair package is no longer executable against the current repository.

dispatch boundary:
- Summarized historical package; no active Git repair Lane exists.
- Never rerun `git init`, `git remote add`, or `git fetch` from this package against the current valid repository.

truth sources:
- Git manager session: `docs/orchestration/sessions/git-manager-agentpet-2026-07-02.md`.
- Long-worker thread: `019f20fc-9b77-74f3-aa3d-ba8348cdec1c`.
- Remote: `https://github.com/locooooooooo/AgentPet.git`.

historical preflight from Git manager callback:
- Local `.git` exists as an empty directory and is not valid Git metadata.
- `git status --short --branch` fails with `fatal: not a git repository`.
- Remote `locooooooooo/AgentPet` is reachable, empty, and reports default branch `main`.
- Viewer permission was previously reported as `ADMIN`.

live-state update:
- A later PM read-only check observed valid local Git metadata, branch `main`, origin `https://github.com/locooooooooo/AgentPet.git`, `d158cad Initial commit`, and a staged index.
- Do not execute this repair package blindly against the current workspace.
- Current Git follow-up is tracked by `docs/orchestration/tasks/git-staging-review-agentpet-v0.1.md`.
- The authorized AgentPet import was committed as `fa9e08b Import AgentPet workspace` and pushed to `origin/main`; subsequent control-plane work has continued on the valid repository.

historical proposed write scope:
- Repair local Git metadata only:
  - `git init -b main`
  - `git remote add origin https://github.com/locooooooooo/AgentPet.git`
  - `git fetch origin`
  - `git status --ignored --short`
- Stop immediately after status review output is collected.

forbidden scope:
- Do not stage files.
- Do not commit.
- Do not push.
- Do not remove, reset, clean, or overwrite project files.
- Do not change remote repository settings.
- Do not enable or execute Codex, Trae, Qoder, or any connector.
- Do not edit M4/control-cockpit implementation files.

historical repair acceptance:
- Explicit same-message user authorization is present before any Git write command runs.
- Callback lists each Git command executed, exit code, and important output.
- Callback confirms local `.git` is valid enough for `git status --ignored --short`.
- Callback stops before staging and asks for staging review.
- `npm.cmd run orchestration:check` passes after recording the repair callback.
- If any command fails, the callback records the exact command, exit code, and stderr, then stops without fallback mutation.

blockers:
- None for this historical package; the repair/import path is completed.
- Any current Git-state decision belongs to `git-staging-review-agentpet-v0.1`, not this repair task.

next action:
- Preserve summarized evidence and do not execute the historical command list.
- Use a fresh read-only staging review before any future Git-state decision.

summary:
- Summarized historical Git repair package; authorized import/push completed and rerunning repair commands is prohibited.
