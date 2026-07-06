[短工]#r0-readme-closeout@2026-07-04

⟦tag:v2|session|r0-readme-closeout-2026-07-04⟧
⟦tag:v2|task|ranch-real-integration-p0-v0.1⟧

loop state: summarized
dispatch state: summarized

date: 2026-07-04
source request: `C0-6 -> cockpit P0 accepted -> R0-4 -> R0-5 -> 最后再决策 R0-3 connector`
task card: `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`

objective:
- Close R0-5 by aligning README wording with the implemented real local spawn and fallback behavior.

acceptance result:
- R0-5 accepted.

completed:
- `README.md` product positioning now says Electron main-process IPC plus `child_process.spawn` connects the local real-process pipeline.
- `README.md` current scope now says real spawn failure falls back to a simulated runner fallback.
- README still points external agent CLI integration to v0.4+ instead of implying connectors are enabled now.

incomplete:
- None for R0-5.

blockers:
- None for R0-5.

next action:
- Treat R0-5 as accepted.

evidence:
- `README.md` first paragraph contains `Electron 主进程 IPC + child_process.spawn`.
- `README.md` current scope contains `真实 spawn 失败时回退到模拟 runner fallback`.
