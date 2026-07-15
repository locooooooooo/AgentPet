# realtime-agent-cockpit P0-C authorization decision 2026-07-15

[PM]#realtime-p0-c-authorization-decision@2026-07-15
⟦tag:v2|session|realtime-agent-cockpit-p0-c-authorization-decision-2026-07-15⟧

loop state: standby
dispatch state: standby
status: authorization_required_not_eligible

## decision

- `DO NOT AUTHORIZE P0-C NOW`.
- This packet prepares the later user decision only. It does not execute Codex or any other external Agent CLI.

## current evidence

- A6 trusted authorization is accepted/pushed as `a44abd6`.
- A7 process reattach is accepted/pushed as `e2031cd`.
- B2 controlled non-Agent production lifecycle, terminal DOM, duplicate protection and cleanup passed.
- B2 is not accepted because PM independent overlapping-CIM visible-DOM `p95=1524ms` exceeds the `500ms` budget.
- A7.1 requirements are prepared but implementation remains `authorization_required`.
- External Agent CLI spawn count is `0`.

## machine-gate snapshot

- Codex remains `draft/pending`, `enabledByDefault=false`, command unchanged.
- Trae and Qoder remain intentionally command-empty placeholders.
- `docs/orchestration/connectors.json` and `status.json` `connectors[]` are unchanged.
- Executable discovery is not execution readiness and is not authorization.

## prerequisites for a future authorize decision

1. A7.1 is explicitly authorized, implemented, independently accepted, committed and pushed.
2. B2 is rerun through production main/preload/renderer/DOM with at least six overlapping real CIM samples and `p95 <=500ms`.
3. B2 duplicate terminal/subscription counts and controlled child residue remain `0`.
4. Runtime/truth/orchestration/Connector-safety/lint/build/diff gates all pass from the final commit candidate.
5. A new user message explicitly authorizes one Codex-only read-only execution window, cwd, allowed reads, timeout and stop conditions.
6. Pre-run and post-run workspace hashes/status evidence is defined before execution.

## future controlled envelope

- Connector: Codex only.
- Task: read one known small file and return a fixed structured summary; no workspace writes.
- Shell: false; retry: `0`; timeout: maximum `120s`.
- Cwd and environment: explicit accepted allowlists only.
- Stop immediately on policy drift, unknown write, cwd escape, secret exposure, cancellation or timeout.
- Preserve the complete C-01 through C-12 matrix from `realtime-agent-cockpit-p0-c-codex-acceptance-v0.1.md`.

## prohibited by this packet

- Running Codex, Trae, Qoder, OpenClaw, Claude, MiniMax or OpenCode.
- Modifying connector `approvalStatus`, `enabledByDefault`, `command`, cwd or env policy.
- Treating controlled Node, fixtures, executable discovery or browser fallback as real Agent E2E.
- Dispatching P0-C while B2 is blocked or without a fresh explicit execution authorization.

## future decision choices

- `AUTHORIZE ONE CONTROLLED CODEX RUN`: valid only after every prerequisite above is proven in current state.
- `HOLD`: keep P0-C standby and all machine gates unchanged.
- `REJECT`: close the proposed run without changing machine gates.

Current forced choice is `HOLD` because B2 is blocked and A7.1 is not implemented.

## summary

- The P0-C decision packet is ready, but execution is not eligible or authorized; no external Agent CLI ran and all Connector machine gates remain unchanged.
