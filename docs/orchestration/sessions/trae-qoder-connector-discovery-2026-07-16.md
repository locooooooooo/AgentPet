# Trae/Qoder Connector Discovery 2026-07-16

[长工]#trae-qoder-discovery@2026-07-16
⟦tag:v2|session|trae-qoder-connector-discovery-2026-07-16⟧

status: completed_with_blockers
loop state: summarized
dispatch state: summarized

scope:
- Discover local Trae/Qoder command surfaces without reading credentials.
- Run exactly one authorized read-only Trae smoke; do not run a Qoder prompt.
- Add a bounded Trae runtime adapter and fail closed on a non-empty top-level stdout `error`.

evidence:
- Trae `0.120.40` resolves as `trae-cli`; help exposes `--print`, JSON/stream-JSON output and query timeout.
- The single smoke used workspace-root cwd, JSON output, a 30-second query timeout, a 60-second outer limit, Read-only tool policy, and a package metadata prompt.
- Smoke completed in `755ms`, produced parseable JSON and exit code `0`, but returned top-level `error: Models is required`.
- Git status, HEAD, and `package.json` hash/mtime were unchanged; no visible UI or Trae executable residue remained.
- Qoder `1.13.3` exposes a desktop `chat` subcommand only. Static manifests provide no independent Agent `bin` or executable, and chat provides no structured output, timeout, headless, or auth controls.
- No credential content was read or emitted. No Qoder prompt was executed.

implementation:
- Trae adapter shape is `--print --output-format=stream-json ...policyArgs prompt`, with prompt last.
- Runtime treats a non-empty top-level Trae stdout `error` as `process-error` even when process exit code is `0`.
- Production machine policy remains non-executing: Trae is `draft/pending/enabled=false`; Qoder is `disabled/rejected/enabled=false` with an empty command.
- Runtime and gate fixtures verify Trae invocation, exit-0 error handling, and production discovery/spawn `0/0`.

blockers:
- Trae has no verified Models configuration, successful model response, or confirmed authentication.
- Qoder has no independent headless Agent CLI/API suitable for captured Connector execution.

next action:
- Keep both disabled. Trae requires a non-secret Models configuration plus a new explicit smoke authorization; Qoder requires a new headless interface before reconsideration.
