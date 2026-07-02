# AgentPet Git Repair Dispatch Package

[短工]#git-repair-agentpet@v0.1
⟦tag:v2|task|git-repair-agentpet-v0.1⟧

objective:
- Prepare the minimal Git metadata repair lane for `E:\多agent牛马` -> `https://github.com/locooooooooo/AgentPet.git` without running it before explicit same-message authorization.
- Keep the existing AgentPet Git manager long-worker as the owning diagnosis source.

dispatch state:
- Standby. This is a future repair dispatch package, not an active Git repair lane.
- Do not run `git init`, `git remote add`, `git fetch`, staging, commit, push, reset, clean, or file removal from this package until PM/user explicitly authorizes Git repair in the same message.

truth sources:
- Git manager session: `docs/orchestration/sessions/git-manager-agentpet-2026-07-02.md`.
- Long-worker thread: `019f20fc-9b77-74f3-aa3d-ba8348cdec1c`.
- Remote: `https://github.com/locooooooooo/AgentPet.git`.

current preflight:
- Local `.git` exists as an empty directory and is not valid Git metadata.
- `git status --short --branch` fails with `fatal: not a git repository`.
- Remote `locooooooooo/AgentPet` is reachable, empty, and reports default branch `main`.
- Viewer permission was previously reported as `ADMIN`.

future write scope:
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

repair acceptance:
- Explicit same-message user authorization is present before any Git write command runs.
- Callback lists each Git command executed, exit code, and important output.
- Callback confirms local `.git` is valid enough for `git status --ignored --short`.
- Callback stops before staging and asks for staging review.
- `npm.cmd run orchestration:check` passes after recording the repair callback.
- If any command fails, the callback records the exact command, exit code, and stderr, then stops without fallback mutation.

blockers:
- Git repair is not authorized yet.
- Local Git metadata is invalid until the repair lane runs.
- Remote has no first commit, so push/first-commit decisions remain a separate future authorization.

next action:
- Wait for PM/user explicit Git repair authorization.
- On authorization, execute only the future write scope and stop for staging review.

summary:
- Standby Git repair dispatch package; no Git repair started.
