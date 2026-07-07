import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function filePath(relativePath) {
  return path.join(root, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(filePath(relativePath));
}

function read(relativePath) {
  if (!exists(relativePath)) {
    errors.push(`missing file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(filePath(relativePath), 'utf8');
}

function readJson(relativePath) {
  const content = read(relativePath);
  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    errors.push(`invalid json: ${relativePath}: ${error.message}`);
    return null;
  }
}

function requireText(name, content, snippets) {
  snippets.forEach((snippet) => {
    if (!content.includes(snippet)) {
      errors.push(`${name} missing required text: ${snippet}`);
    }
  });
}

function forbidText(name, content, snippets) {
  const normalizedContent = content.toLowerCase();
  snippets.forEach((snippet) => {
    if (normalizedContent.includes(snippet.toLowerCase())) {
      errors.push(`${name} contains stale text: ${snippet}`);
    }
  });
}

function parseSessionState(relativePath, content) {
  const loopState = content.match(/^loop state:\s*(.+)$/m)?.[1]?.trim();
  const dispatchState = content.match(/^dispatch state:\s*(.+)$/m)?.[1]?.trim();
  const identity = content.match(/^\[[^\]\r\n]+\]#[^\r\n]+$/m)?.[0]?.trim();

  if (!loopState) {
    errors.push(`${relativePath} missing loop state`);
  }
  if (!dispatchState) {
    errors.push(`${relativePath} missing dispatch state`);
  }
  if (!identity) {
    errors.push(`${relativePath} missing identity header`);
  }

  return { loopState, dispatchState, identity };
}

function strongestExpectedState(states) {
  const priority = ['active', 'standby', 'blocked', 'summarized'];
  return priority.find((state) => states.includes(state));
}

function requireSameValue(label, left, right) {
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    errors.push(`${label} mismatch: ${JSON.stringify(left)} !== ${JSON.stringify(right)}`);
  }
}

function requireUnique(label, values) {
  const seen = new Set();
  values.forEach((value) => {
    if (!value) {
      return;
    }
    if (seen.has(value)) {
      errors.push(`${label} must be unique: ${value}`);
    }
    seen.add(value);
  });
}

function stripInlineCode(value) {
  return value.replace(/`/g, '');
}

function parseInlineCodeValues(value) {
  return [...value.matchAll(/`([^`]+)`/g)].map((match) => match[1].trim()).filter(Boolean);
}

function parseRoleLedgerRows(content) {
  const contentLines = content.split(/\r?\n/);
  const startIndex = contentLines.findIndex((line) => line.trim() === 'role ledger:');
  if (startIndex === -1) {
    return [];
  }

  const sectionLines = [];
  for (const line of contentLines.slice(startIndex + 1)) {
    if (line.trim() === 'acceptance:' || line.trim() === 'non-goals:') {
      break;
    }
    sectionLines.push(line);
  }

  return sectionLines
    .filter((line) => line.trim().startsWith('|'))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length === 4 && cells[0] !== 'role' && !cells[0].startsWith('---'))
    .map(([role, currentState, evidence, accountabilityAction]) => ({
      role: stripInlineCode(role),
      currentState,
      evidence,
      accountabilityAction
    }));
}

function parseDecisionQueueRows(content) {
  const contentLines = content.split(/\r?\n/);
  const startIndex = contentLines.findIndex((line) => line.trim() === 'decision queue:');
  if (startIndex === -1) {
    return [];
  }

  const sectionLines = [];
  for (const line of contentLines.slice(startIndex + 1)) {
    if (line.trim() === 'coverage guard:' || line.trim() === 'non-goals:') {
      break;
    }
    sectionLines.push(line);
  }

  return sectionLines
    .filter((line) => line.trim().startsWith('|'))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length === 5 && cells[0] !== 'queue item' && !cells[0].startsWith('---'))
    .map(([queueItem, currentOwner, requiredDecisionOrCondition, allowedFirstActionAfterDecision, mustRemainBlockedUntil]) => ({
      queueItem,
      currentOwner: stripInlineCode(currentOwner),
      requiredDecisionOrCondition,
      allowedFirstActionAfterDecision,
      mustRemainBlockedUntil
    }));
}

function parseDecisionCoverageRows(content) {
  const contentLines = content.split(/\r?\n/);
  const startIndex = contentLines.findIndex((line) => line.trim() === 'coverage guard:');
  if (startIndex === -1) {
    return [];
  }

  const sectionLines = [];
  for (const line of contentLines.slice(startIndex + 1)) {
    if (line.trim() === 'session closeout coverage:' || line.trim() === 'non-goals:' || line.trim() === 'acceptance:') {
      break;
    }
    sectionLines.push(line);
  }

  return sectionLines
    .filter((line) => line.trim().startsWith('|'))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length === 2 && cells[0] !== 'open status lane' && !cells[0].startsWith('---'))
    .map(([openStatusLane, queueCoverage]) => ({
      openStatusLane,
      queueCoverage
    }));
}

function parseSessionCloseoutCoverageRows(content) {
  const contentLines = content.split(/\r?\n/);
  const startIndex = contentLines.findIndex((line) => line.trim() === 'session closeout coverage:');
  if (startIndex === -1) {
    return [];
  }

  const sectionLines = [];
  for (const line of contentLines.slice(startIndex + 1)) {
    if (line.trim() === 'non-goals:' || line.trim() === 'acceptance:') {
      break;
    }
    sectionLines.push(line);
  }

  return sectionLines
    .filter((line) => line.trim().startsWith('|'))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length === 2 && cells[0] !== 'queue item' && !cells[0].startsWith('---'))
    .map(([queueItem, requiredCloseoutEvidence]) => ({
      queueItem,
      requiredCloseoutEvidence
    }));
}

function parseBulletSection(content, heading) {
  const contentLines = content.split(/\r?\n/);
  const startIndex = contentLines.findIndex((line) => line.trim() === heading);
  if (startIndex === -1) {
    return [];
  }

  const items = [];
  for (const line of contentLines.slice(startIndex + 1)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (!line.startsWith(' ') && !line.startsWith('\t') && trimmed.endsWith(':') && !trimmed.startsWith('-')) {
      break;
    }
    if (trimmed.startsWith('- ')) {
      items.push(trimmed.slice(2));
    }
  }
  return items;
}

const index = read('docs/orchestration/index.md');
const pmRole = read('docs/orchestration/roles/pm.md');
const supervisorRole = read('docs/orchestration/roles/supervisor.md');
const startupPrompt = read('docs/orchestration/startup-prompt.md');
const callbackTemplate = read('docs/orchestration/callback-summary-template.md');
const task = read('docs/orchestration/tasks/multi-agent-runtime-v0.1.md');
const connectorTask = read('docs/orchestration/tasks/connector-policy-v0.1.md');
const connectorAcceptanceReviewTask = read('docs/orchestration/tasks/connector-acceptance-review-v0.1.md');
const dailyDecisionQueueTask = read('docs/orchestration/tasks/daily-decision-queue-2026-07-02.md');
const dailyRoleAccountabilityTask = read('docs/orchestration/tasks/daily-role-accountability-2026-07-02.md');
const gitRepairTask = read('docs/orchestration/tasks/git-repair-agentpet-v0.1.md');
const gitStagingReviewTask = read('docs/orchestration/tasks/git-staging-review-agentpet-v0.1.md');
const ranchM4RequirementsTask = read('docs/orchestration/tasks/ranch-m4-requirements-v0.2.md');
const ranchM4ImplementationTask = read('docs/orchestration/tasks/ranch-m4-implementation-v0.2.md');
const ranchPointerSmokeTask = read('docs/orchestration/tasks/ranch-pointer-smoke-v0.2.md');
const ranchPointerSmokeManualEvidenceTask = read('docs/orchestration/tasks/ranch-pointer-smoke-manual-evidence-v0.2.md');
const session = read('docs/orchestration/sessions/main-thread-2026-07-01-runtime-bootstrap.md');
const dailySupervisionSession = read('docs/orchestration/sessions/daily-supervision-2026-07-02.md');
const gitManagerSession = read('docs/orchestration/sessions/git-manager-agentpet-2026-07-02.md');
const statusJson = readJson('docs/orchestration/status.json');
const connectorSchema = readJson('docs/orchestration/connectors.schema.json');
const connectorConfig = readJson('docs/orchestration/connectors.json');
const uiStatus = read('src/lib/orchestrationStatus.ts');
const workspace = read('src/components/NiuMaWorkspace.tsx');
const statusStrip = read('src/components/StatusStrip.tsx');
const reportScript = read('scripts/orchestration-report.mjs');
const preflightScript = read('scripts/connector-preflight.mjs');
const packageJson = readJson('package.json');

requireText('index', index, [
  'loop state:',
  'dispatch state:',
  'read order:',
  'tracked control cards:',
  'tracked business cards:',
  'dispatch gate:',
  'current role split:',
  'docs/orchestration/connectors.schema.json',
  'docs/orchestration/connectors.json',
  '⟦tag:v2|role|pm-control-v0.1⟧',
  '⟦tag:v2|role|supervisor-control-v0.1⟧',
  '⟦tag:v2|task|multi-agent-runtime-v0.1⟧',
  '⟦tag:v2|task|connector-policy-v0.1⟧',
  '⟦tag:v2|session|main-thread-2026-07-01-runtime-bootstrap⟧'
]);

requireText('pm role', pmRole, [
  '[PM]#multi-agent-control@v0.1',
  '⟦tag:v2|role|pm-control-v0.1⟧',
  'dispatch',
  'acceptance'
]);

requireText('supervisor role', supervisorRole, [
  '[监督]#multi-agent-control@v0.1',
  '⟦tag:v2|role|supervisor-control-v0.1⟧',
  'drift',
  'correction'
]);

requireText('startup prompt', startupPrompt, [
  '[PM]#multi-agent-control@v0.1',
  'read first:',
  'role selection:',
  'mandatory rules:',
  'npm run orchestration:report'
]);

requireText('callback template', callbackTemplate, [
  '[角色]#模块@版本',
  'loop state: waiting_callback',
  'dispatch state: waiting_callback',
  'completed:',
  'evidence:'
]);

requireText('task card', task, [
  'objective:',
  'scope:',
  'acceptance:',
  'current state:',
  'blockers:',
  'next action:'
]);

requireText('connector policy task card', connectorTask, [
  '[短工]#connector-policy@v0.1',
  '⟦tag:v2|task|connector-policy-v0.1⟧',
  'command',
  'cwd',
  'env',
  'acceptance:'
]);

requireText('connector acceptance review task card', connectorAcceptanceReviewTask, [
  '[PM]#connector-acceptance-review@v0.1',
  '⟦tag:v2|task|connector-acceptance-review-v0.1⟧',
  'Standby. This is a future acceptance review package, not an execution binding lane.',
  'Do not change `approvalStatus` to `accepted`, set `enabledByDefault` to `true`, or run connector commands from this package.',
  'Codex is `draft / pending / enabled=false`',
  'Trae is `placeholder / not-requested / enabled=false`',
  'Qoder is `placeholder / not-requested / enabled=false`',
  'No connector satisfies `status=ready + approvalStatus=accepted + enabledByDefault=true`.',
  'Connector safety command: `npm.cmd run orchestration:connector-safety`.',
  'Confirm `npm.cmd run orchestration:connector-safety` passes after any proposed connector metadata or runtime-surface change.',
  'Do not set `"approvalStatus": "accepted"`.',
  'Do not set `"enabledByDefault": true`.',
  'Do not dispatch connector-agent-core or execution binding.',
  'Do not run Git repair, staging, commit, push, reset, clean, or file removal.',
  'Do not edit M4/control-cockpit implementation files.',
  'Standby connector acceptance review package; no connector accepted, enabled, or executed.'
]);

requireText('daily decision queue task card', dailyDecisionQueueTask, [
  '[PM]#daily-decision-queue@2026-07-02',
  '⟦tag:v2|task|daily-decision-queue-2026-07-02⟧',
  'Standby decision queue.',
  'This queue does not authorize work by itself; each item still requires its own explicit user/PM decision or external condition.',
  'M4 implementation has been completed and summarized outside this standby queue.',
  'Git staging review package: `docs/orchestration/tasks/git-staging-review-agentpet-v0.1.md`.',
  '| AgentPet Git repair | `[短工]#git-repair-agentpet@v0.1` | Explicit same-message authorization for local Git metadata repair | Run only `git init -b main` -> `git remote add origin https://github.com/locooooooooo/AgentPet.git` -> `git fetch origin` -> `git status --ignored --short`, then stop | Authorization is absent |',
  '| AgentPet Git state review | `[PM]#git-staging-review-agentpet@v0.1` | PM/user decides how to handle the currently observed valid repo and working-tree/index state | Run read-only Git state review first, then ask for stage/unstage/commit/push/leave-untouched decision | Review decision is absent |',
  '| Connector acceptance | `[PM]#connector-acceptance-review@v0.1` | PM/user accepts, rejects, or revises connector machine gate fields | Update connector metadata only if the decision explicitly says so, then rerun `npm.cmd run orchestration:preflight` and `npm.cmd run orchestration:connector-safety` | No connector decision exists |',
  '| Transparent pointer smoke | `[监督]#ranch-pointer-smoke-manual-evidence@v0.2` | Manual observer or alternate transparent-window capture route is available | Run parent pointer-smoke route and fill evidence table | Capture route is unavailable |',
  '| Live sub-agent quota | `[监督]#multi-agent-control@v0.1` | Service-side `403 DAILY_LIMIT_EXCEEDED` can be rechecked without treating connectors as available | Recheck quota state and record exact result | Recheck route is unavailable |',
  'coverage guard:',
  '| open status lane | queue coverage |',
  '| connector-policy | Connector acceptance |',
  '| connector-acceptance-review | Connector acceptance |',
  '| live-subagents | Live sub-agent quota |',
  '| git-manager-agentpet | AgentPet Git state review |',
  '| git-repair-agentpet | AgentPet Git repair |',
  '| git-staging-review-agentpet | AgentPet Git state review |',
  '| ranch-pointer-smoke | Transparent pointer smoke |',
  '| ranch-pointer-smoke-manual-evidence | Transparent pointer smoke |',
  'session closeout coverage:',
  '| queue item | required closeout evidence |',
  '| AgentPet Git repair | `AgentPet Git repair` |',
  '| AgentPet Git state review | `git-staging-review-agentpet-v0.1` |',
  '| Connector acceptance | `Connector acceptance review package exists` |',
  '| Transparent pointer smoke | `Ranch pointer-smoke verification and manual evidence packages are standby` |',
  '| Live sub-agent quota | `403 DAILY_LIMIT_EXCEEDED` |',
  '`daily-decision-queue` and `daily-role-accountability` are supervision artifacts',
  'Any new `standby` or `blocked` lane in `docs/orchestration/status.json` must be added to this guard or explicitly exempted in `scripts/check-orchestration.mjs`.',
  'Do not repair Git, stage, commit, push, reset, clean, or remove files.',
  'Do not accept, enable, execute, or bind Codex, Trae, Qoder, or any connector.',
  'Do not widen the accepted M4 long-worker delivery beyond its declared write scope or edit locked M4/control-cockpit files from this standby queue.',
  'Do not run Electron pointer input or mark pointer smoke accepted.',
  'Do not create duplicate long-worker threads.',
  'The decision queue and coverage guard tables are parseable; queue items and coverage lanes are unique, every queue row has non-empty owner/decision/action/blocker fields, every queue owner resolves to a tracked `docs/orchestration/status.json` role title, every coverage row points to an existing queue item and a current decision-bearing `standby` or `blocked` lane, and every queue item is used by at least one coverage row.',
  'The session closeout coverage table is parseable, every queue item has exactly one required closeout evidence phrase, and every required phrase appears in the parsed `incomplete:`, `blockers:`, or `next action:` closeout sections of `docs/orchestration/sessions/daily-supervision-2026-07-02.md`.',
  'Every decision-bearing `standby` or `blocked` lane in `docs/orchestration/status.json` is covered by the coverage guard.',
  '`npm.cmd run orchestration:report` shows this queue as standby, not active, and prints the coverage guard plus session closeout coverage, including each open lane -> queue item and queue item -> required closeout evidence row.',
  'Git repair, staging review, unstage, commit, and push remain blocked unless explicitly authorized in a later message.',
  'Standby daily decision queue; no blocked item executed.'
]);

requireText('daily role accountability task card', dailyRoleAccountabilityTask, [
  '[PM]#daily-role-accountability@2026-07-02',
  '⟦tag:v2|task|daily-role-accountability-2026-07-02⟧',
  'Standby accountability ledger.',
  'This ledger is a supervision artifact only; it does not authorize Git repair, connector execution, pointer input, duplicate worker creation, or M4 scope expansion.',
  '| `[PM]#multi-agent-control@v0.1` | active | `docs/orchestration/index.md`, `docs/orchestration/status.json` | Keep dispatch/state truth aligned and record each supervision pass. |',
  '| `[监督]#multi-agent-control@v0.1` | active | `docs/orchestration/roles/supervisor.md`, `scripts/check-orchestration.mjs` | Keep drift checks strict and preserve blocked/standby boundaries. |',
  '| `[短工]#connector-policy@v0.1` | standby | `docs/orchestration/tasks/connector-policy-v0.1.md` | Wait for connector machine-gate acceptance or revision. |',
  '| `[PM]#connector-acceptance-review@v0.1` | standby | `docs/orchestration/tasks/connector-acceptance-review-v0.1.md` | Keep no accepted/no enabled/no execution until a decision exists. |',
  '| `[PM]#daily-supervision@2026-07-02` daily-supervision lane | active | `docs/orchestration/sessions/daily-supervision-2026-07-02.md` | Keep PM supervision active while collecting Git callbacks and preserving accepted M4 evidence. |',
  '| `[PM]#daily-decision-queue@2026-07-02` | standby | `docs/orchestration/tasks/daily-decision-queue-2026-07-02.md` | Use as the next PM callback surface for blocked decisions. |',
  '| `[PM]#daily-role-accountability@2026-07-02` | standby | `docs/orchestration/tasks/daily-role-accountability-2026-07-02.md` | Keep this ledger aligned with every `status.json` role. |',
  '| `[长工]#ranch-m1-m2-correction@v0.2` | summarized | `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md` | Preserve accepted M1/M2 correction evidence; do not reopen implementation. |',
  '| `[长工]#ranch-m3-plan@v0.2` | summarized | `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md` | Keep M3 planning summarized and superseded by accepted M3 owners. |',
  '| `[监督]#ranch-v0.2-audit@v0.2` | summarized | `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md` | Treat pre-correction audit as historical evidence, not a reopened blocker. |',
  '| `[长工]#m3-main-bridge@v0.2` | summarized | `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md` | Preserve passed main/preload/types/fallback evidence. |',
  '| `[长工]#m3-ranch-entry@v0.2` | summarized | `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md` | Preserve passed ranch renderer interaction evidence while pointer smoke remains separate. |',
  '| `[长工]#git-manager@AgentPet` | standby | `docs/orchestration/sessions/git-manager-agentpet-2026-07-02.md` | Collect post-push read-only callback; do not run further Git writes without explicit decision. |',
  '| `[短工]#git-repair-agentpet@v0.1` | standby | `docs/orchestration/tasks/git-repair-agentpet-v0.1.md` | Preserve as historical repair boundary; do not rerun blindly. |',
  '| `[PM]#git-staging-review-agentpet@v0.1` | standby | `docs/orchestration/tasks/git-staging-review-agentpet-v0.1.md` | Wait for a decision on the current valid repo and working-tree/index state. |',
  '| `[长工]#ranch-m4-implementation@v0.2` | summarized | `docs/orchestration/tasks/ranch-m4-implementation-v0.2.md` | Preserve thread `019f227a-8978-7df1-8b3f-738ccdb01b18` callback and PM verification evidence. |',
  '| `[监督]#ranch-pointer-smoke@v0.2` | standby | `docs/orchestration/tasks/ranch-pointer-smoke-v0.2.md` | Wait for a transparent-window capture route. |',
  '| `[监督]#multi-agent-control@v0.1` live-subagents lane | blocked | `docs/orchestration/status.json` | Recheck `403 DAILY_LIMIT_EXCEEDED` only when a safe route exists. |',
  'Every role ledger `current state` matches the corresponding `docs/orchestration/status.json` role status.',
  'Every role ledger row resolves to either a tracked `docs/orchestration/status.json` role title or a real `docs/orchestration/status.json` lane responsibility label, each parsed state matches that source, and each row has a non-empty accountability action.',
  'Every non-summarized `docs/orchestration/status.json` lane is covered by either its tracked role owner or a lane-specific role ledger row.',
  'Every role ledger evidence cell contains at least one repo path, every referenced path exists, and every `docs/orchestration/*.md` evidence path is tracked by `docs/orchestration/index.md`.',
  'The only active lanes in `docs/orchestration/status.json` are `daily-supervision` and `weekly-requirements`; no implementation, connector, Git, M4, homepage-ui-design, or pointer-smoke lane is active without a fresh dispatch.',
  'Standby roles are not called complete.',
  'Blocked lanes retain the exact blocker and do not imply a connector or sub-agent is available.',
  '`npm.cmd run orchestration:report` shows this ledger as standby, not active, and prints the active lane control, daily supervision closeout, daily decision coverage, and daily supervision closeout coverage summaries.',
  'Do not run Git repair, staging, commit, push, reset, clean, or file removal.',
  'Do not accept, enable, execute, or bind Codex, Trae, Qoder, or any connector.',
  'Do not widen M4 beyond the accepted long-worker delivery scope.',
  'Do not launch Electron for pointer smoke or run pointer input.',
  'Standby accountability ledger; records accepted M4 long-worker delivery and keeps other blocked/standby roles bounded.'
]);

requireText('AgentPet Git repair task card', gitRepairTask, [
  '[短工]#git-repair-agentpet@v0.1',
  '⟦tag:v2|task|git-repair-agentpet-v0.1⟧',
  'Standby. This is a future repair dispatch package, not an active Git repair lane.',
  'explicit same-message authorization',
  'Do not run `git init`, `git remote add`, `git fetch`, staging, commit, push, reset, clean, or file removal from this package until PM/user explicitly authorizes Git repair in the same message.',
  'git init -b main',
  'git remote add origin https://github.com/locooooooooo/AgentPet.git',
  'git fetch origin',
  'git status --ignored --short',
  'live-state update:',
  'A later PM read-only check observed valid local Git metadata, branch `main`, origin `https://github.com/locooooooooo/AgentPet.git`, `d158cad Initial commit`, and a staged index.',
  'Do not execute this repair package blindly against the current workspace.',
  'Current Git follow-up is tracked by `docs/orchestration/tasks/git-staging-review-agentpet-v0.1.md`.',
  'Stop immediately after status review output is collected.',
  'Do not stage files.',
  'Do not commit.',
  'Do not push.',
  'Do not remove, reset, clean, or overwrite project files.',
  'Do not enable or execute Codex, Trae, Qoder, or any connector.',
  'Do not edit M4/control-cockpit implementation files.',
  'Standby Git repair dispatch package; no Git repair started.'
]);

requireText('AgentPet Git staging review task card', gitStagingReviewTask, [
  '[PM]#git-staging-review-agentpet@v0.1',
  '⟦tag:v2|task|git-staging-review-agentpet-v0.1⟧',
  '\nobjective:\n',
  '\ndispatch state:\n',
  '\ntruth sources:\n',
  '\nread-only observation history:\n',
  '\nallowed future read-only review:\n',
  '\nforbidden scope:\n',
  '\nacceptance:\n',
  '\nblockers:\n',
  '\nnext action:\n',
  '\nsummary:\n',
  'Standby. This is a review package for an already-observed Git state, not a Git repair, staging, unstage, commit, or push lane.',
  'This package does not authorize `git add`, `git restore --staged`, `git commit`, `git push`, reset, clean, or file removal.',
  '`.git` is now valid enough for `git rev-parse --is-inside-work-tree` to return `true`.',
  'Current branch is `main`.',
  '`origin` fetch/push remote points to `https://github.com/locooooooooo/AgentPet.git`.',
  'Earlier in this PM pass, `git log --oneline -1` reported `d158cad Initial commit` and `git status --porcelain=v1 --branch` reported staged project files plus untracked local log files.',
  'Latest read-only check reports `fa9e08b Import AgentPet workspace`, upstream `origin/main`, no staged diff from `git diff --cached --name-status`, and only unstaged PM docs/script changes plus untracked local log files and this review card.',
  'This PM pass did not run `git init`, `git remote add`, `git fetch`, `git add`, `git commit`, `git push`, reset, clean, or file removal.',
  'git diff --cached --stat',
  'git diff --cached --name-status',
  'Do not stage, unstage, commit, push, reset, clean, or remove files.',
  'Do not accept, enable, execute, or bind Codex, Trae, Qoder, or any connector.',
  'The current Git state drift is visible in the daily decision queue and daily role accountability ledger.',
  'Commit/push remain separate explicit decisions.',
  'No PM/user decision exists for how to handle the current Git working tree, index, commit, or push state.',
  'The earlier repair package no longer matches the live Git state and must not be executed blindly.',
  'Standby Git state review package; no Git write action authorized or executed.'
]);

requireText('ranch M4 requirements task card', ranchM4RequirementsTask, [
  '[PM]#ranch-m4-requirements@v0.2',
  '⟦tag:v2|task|ranch-m4-requirements-v0.2⟧',
  'Requirements readiness is summarized.',
  'Summarized implementation dispatch package exists at `docs/orchestration/tasks/ranch-m4-implementation-v0.2.md`.',
  'M4 implementation was completed in long-worker thread `019f227a-8978-7df1-8b3f-738ccdb01b18` and accepted after PM verification.',
  'Future M4 scope expansion requires a new bounded dispatch, touched-file review, negative checks, and gates.',
  'not in scope:',
  'Editing `src/components/NiuMaAvatar.tsx`.',
  'Editing the central 4x2 control-cockpit grid in `src/components/NiuMaWorkspace.tsx`.',
  'Editing `src/index.css`, `src/lib/agentCore.ts`, or `icon/**`.',
  'Enabling Codex, Trae, Qoder, or any connector.',
  'Future M4 implementation task declares its write scope before editing files.',
  'Keep the requirements lane summarized and use the M4 implementation package as accepted evidence.'
]);

requireText('ranch M4 implementation task card', ranchM4ImplementationTask, [
  '[长工]#ranch-m4-implementation@v0.2',
  '⟦tag:v2|task|ranch-m4-implementation-v0.2⟧',
  'Summarized. User challenged the PM to use long-workers and move requirements',
  'thread `019f227a-8978-7df1-8b3f-738ccdb01b18` with `gpt-5.4` + `xhigh`',
  'Completed: `package.json` description/productName now use `桌面牧场` while `name` remains `multi-agent-niuma`.',
  'Completed: `README.md` H1 and intro use `桌面牧场` while preserving project code name `multi-agent-niuma`.',
  'Completed: `src/App.tsx` boot screens use `桌面牧场 · 控制舱`.',
  'Completed: control cockpit header uses `桌面牧场 · 控制舱` and exposes a compact app-header ranch settings entry.',
  'Do not edit `src/components/NiuMaAvatar.tsx`.',
  'Do not edit the central 4x2 control-cockpit grid inside `src/components/NiuMaWorkspace.tsx`.',
  'Do not edit `src/index.css`, `src/lib/agentCore.ts`, or `icon/**`.',
  'Do not edit `docs/orchestration/connectors.json` to accept or enable any connector.',
  'Implementation is accepted for the declared M4 scope; future scope expansion needs a new dispatch.',
  'Summarized M4 implementation long-worker package; thread `019f227a-8978-7df1-8b3f-738ccdb01b18` completed and PM verified lint/build/orchestration/preflight/connector-safety plus browser settings smoke.'
]);

requireText('ranch pointer smoke task card', ranchPointerSmokeTask, [
  '[监督]#ranch-pointer-smoke@v0.2',
  '⟦tag:v2|task|ranch-pointer-smoke-v0.2⟧',
  'Standby verification package.',
  'Do not run destructive commands, Git repair, connector execution, or M4 implementation while executing this package.',
  'SetIsBorderRequired failed',
  'Treating browser-only rendering proof as sufficient for transparent desktop pointer behavior.',
  'Verify desktop mode click-through outside animal hot zones.',
  'Verify animal double-click summons/focuses the control cockpit.',
  'Verify animal right-click opens the ranch context menu.',
  'Switch to floating mode and verify drag + edge docking persists bounds.',
  'If any pointer step cannot be observed, the callback records it as incomplete with the exact blocked route.',
  'Standby pointer-smoke verification package; no implementation started.'
]);

requireText('ranch pointer smoke manual evidence task card', ranchPointerSmokeManualEvidenceTask, [
  '[监督]#ranch-pointer-smoke-manual-evidence@v0.2',
  '⟦tag:v2|task|ranch-pointer-smoke-manual-evidence-v0.2⟧',
  'Standby evidence package.',
  'Do not execute this package until a manual observer or alternate transparent-window capture route is available.',
  'Do not treat browser-only rendering, accessibility tree output, or build success as sufficient proof for desktop transparent pointer behavior.',
  'SetIsBorderRequired failed',
  '| desktop click-through | click outside animal hot zones reaches the underlying desktop/app | pending | route notes or recording timestamp |  |',
  '| double-click | double-clicking an animal summons/focuses the control cockpit | pending | route notes or recording timestamp |  |',
  '| right-click | right-clicking an animal opens the ranch context menu | pending | route notes or recording timestamp |  |',
  '| floating drag | floating mode drag moves the ranch | pending | route notes or recording timestamp |  |',
  '| edge docking | edge dock preview and persisted bounds are observed after drag | pending | route notes or recording timestamp |  |',
  'Use `pass` only when the current run directly observes the expected desktop behavior.',
  'A callback with any `fail`, `blocked`, or `not-run` pointer behavior remains incomplete.',
  'Do not run Git repair, staging, commit, push, reset, clean, or file removal.',
  'Do not enable, accept, execute, or bind Codex, Trae, Qoder, or any connector.',
  'Do not mark pointer smoke accepted from browser-only proof.',
  'Do not mark M4 implementation active.',
  'Standby manual evidence package; no pointer smoke executed.'
]);

requireText('session card', session, [
  'completed:',
  'incomplete:',
  'blockers:',
  'next action:',
  'evidence:'
]);

requireText('daily supervision session', dailySupervisionSession, [
  '[PM]#daily-supervision@2026-07-02',
  '⟦tag:v2|session|daily-supervision-2026-07-02⟧',
  'loop state: active',
  'dispatch state: active',
  'completed:',
  'incomplete:',
  'blockers:',
  'next action:',
  'evidence:',
  'Transparent ranch window pointer smoke is still not fully automated',
  'AgentPet Git repair standby package remains as a historical boundary',
  'git-staging-review-agentpet-v0.1',
  'git-repair-agentpet-v0.1',
  'Connector acceptance review package exists, but connector policy acceptance is waiting for PM/user decision',
  'connector-acceptance-review-v0.1',
  'Live sub-agent execution remains blocked by the previously recorded service-side `403 DAILY_LIMIT_EXCEEDED`',
  'Control-cockpit central 4x2 grid and protected selling-point files remain locked',
  'AgentPet Git working tree/index state is post-push and has PM docs/script/log drift',
  'Keep `ranch-pointer-smoke-v0.2` and `ranch-pointer-smoke-manual-evidence-v0.2` standby until a manual or alternate transparent-window capture route is available.',
  'ranch-pointer-smoke-manual-evidence-v0.2',
  'Keep connector-policy and `connector-acceptance-review-v0.1` on standby',
  'Keep Git manager, `git-repair-agentpet-v0.1`, and `git-staging-review-agentpet-v0.1` on standby',
  'Daily decision queue is standby and does not authorize any queue item by itself.',
  'daily-decision-queue-2026-07-02',
  'Daily role accountability ledger is standby and records state/evidence/action without changing role states.',
  'daily-role-accountability-2026-07-02',
  'npm.cmd run orchestration:connector-safety'
]);

requireText('AgentPet Git manager session', gitManagerSession, [
  '[长工]#git-manager@AgentPet',
  'thread: `019f20fc-9b77-74f3-aa3d-ba8348cdec1c`',
  'model: `gpt-5.4`',
  'thinking: `xhigh`',
  'loop state: standby',
  'dispatch state: standby',
  'After the pushed import commit, do not edit files, stage, commit, push, reset, clean, or remove files without a fresh explicit same-message user authorization.',
  'fa9e08b Import AgentPet workspace'
]);

requireText('orchestration status source', uiStatus, [
  'ORCHESTRATION_STATUS',
  'CONNECTOR_POLICY',
  "import orchestrationStatus from '../../docs/orchestration/status.json';",
  "import connectorPolicy from '../../docs/orchestration/connectors.json';",
  'status.json',
  'connectors.json',
  'OrchestrationStatus'
]);

requireText('workspace UI', workspace, [
  'ORCHESTRATION_STATUS',
  '角色分工与监督',
  'role-card',
  'lane-chip',
  'StatusStrip'
]);

requireText('status strip UI', statusStrip, [
  'status-strip',
  'status-strip-dropdown',
  'connector-policy-grid',
  'ConnectorGateResult'
]);

requireText('orchestration report script', reportScript, [
  'docs/orchestration/status.json',
  'docs/orchestration/connectors.json',
  'docs/orchestration/sessions/daily-supervision-2026-07-02.md',
  'docs/orchestration/tasks/daily-decision-queue-2026-07-02.md',
  'docs/orchestration/tasks/daily-role-accountability-2026-07-02.md',
  'parseDecisionQueueRows',
  'parseDecisionCoverageRows',
  'parseSessionCloseoutCoverageRows',
  'parseRoleAccountabilityRows',
  'parseBulletSection',
  'daily decision queue has no parsed items',
  'daily decision queue has no parsed coverage rows',
  'daily decision queue has no parsed session closeout coverage rows',
  'daily supervision closeout missing ${label} items',
  'daily decision queue report owner is not a tracked status role',
  'daily decision queue report coverage points to missing item',
  'daily decision queue report session closeout coverage points to missing item',
  'daily decision queue report session closeout coverage missing evidence phrase',
  'daily supervision closeout missing queue item evidence',
  'daily decision queue report item has no coverage lane',
  'daily decision queue report item has no session closeout coverage',
  'daily decision queue report coverage points to missing status lane',
  'daily decision queue report coverage is not an open decision lane',
  'daily decision queue report missing coverage row for open lane',
  'daily decision queue report coverage mismatch for open lane',
  'daily role accountability ledger has no parsed items',
  'daily role accountability report missing status role',
  'daily role accountability report missing non-summarized lane owner or lane row',
  'daily role accountability report row does not resolve to status role or lane',
  'daily role accountability report evidence has no path',
  'daily role accountability report evidence path missing',
  'daily role accountability report evidence markdown is not tracked',
  'daily role accountability report action is empty',
  'active lanes must remain daily-supervision + weekly-requirements after W27 opening',
  'commandState',
  'loop state:',
  'dispatch state:',
  'today plan:',
  'p0 cards:',
  'daily role accountability:',
  'evidence:',
  'action:',
  'active lane control:',
  'expected active lane: daily-supervision, weekly-requirements',
  'daily supervision closeout:',
  'daily decision queue:',
  'first action:',
  'blocked until:',
  'daily decision coverage:',
  'lines.push(`- ${item.openStatusLane} -> ${item.queueCoverage}`);',
  'daily supervision closeout coverage:',
  'lines.push(`- ${item.queueItem} -> ${item.requiredCloseoutEvidence}`);',
  'connectors:'
]);

requireText('connector preflight script', preflightScript, [
  'docs/orchestration/connectors.json',
  'where.exe',
  'connector preflight passed',
  'enabledByDefault',
  'ready connector command is not resolvable'
]);

const referencedMarkdown = [...index.matchAll(/`(docs\/orchestration\/[^`]+\.md)`/g)].map((match) => match[1]);
referencedMarkdown.forEach((relativePath) => {
  if (!exists(relativePath)) {
    errors.push(`index references missing file: ${relativePath}`);
  }
});

referencedMarkdown.forEach((relativePath) => {
  const content = read(relativePath);
  forbidText(relativePath, content, [
    'active business card',
    'active business cards',
    'Active task/session cards exist and are referenced by the index.'
  ]);
});

if (task.includes('summary:\n- Active.') || task.includes('summary:\r\n- Active.')) {
  errors.push('task card summary must describe tracked/summarized state, not bare Active.');
}

const referencedSessions = referencedMarkdown.filter((relativePath) =>
  relativePath.startsWith('docs/orchestration/sessions/')
);
const referencedMarkdownSet = new Set(referencedMarkdown);
const trackedIndexEntries = [...index.matchAll(/^- (role|task|session):\s*(⟦tag:v2\|[^⟧]+⟧)\s*->\s*`(docs\/orchestration\/[^`]+\.md)`/gm)]
  .map((match) => ({
    kind: match[1],
    tag: match[2],
    relativePath: match[3]
  }));
const indexState = parseSessionState('docs/orchestration/index.md', index);

trackedIndexEntries.forEach((entry) => {
  const expectedPrefix = `docs/orchestration/${entry.kind}s/`;
  if (!entry.relativePath.startsWith(expectedPrefix)) {
    errors.push(`index ${entry.kind} tag points outside ${expectedPrefix}: ${entry.relativePath}`);
  }
  const content = read(entry.relativePath);
  if (!content.includes(entry.tag)) {
    errors.push(`index ${entry.kind} tag missing from referenced file ${entry.relativePath}: ${entry.tag}`);
  }
});

if (statusJson) {
  const allowedStates = new Set(['active', 'blocked', 'standby', 'summarized']);
  const allowedP0Statuses = new Set(['pending', 'in_progress', 'summarized', 'accepted', 'blocked']);
  const requiredP0Cards = new Map([
    ['ranch-real-integration-p0', {
      status: 'accepted',
      task: 'docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md',
      progress: 'docs/orchestration/sessions/ranch-real-integration-p0-progress.md'
    }],
    ['cockpit-refactor-p0', {
      status: 'accepted',
      task: 'docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md',
      progress: 'docs/orchestration/sessions/cockpit-refactor-p0-progress.md'
    }]
  ]);
  const roleLedgerRows = parseRoleLedgerRows(dailyRoleAccountabilityTask);
  if (roleLedgerRows.length === 0) {
    errors.push('daily role accountability ledger has no parsed role rows');
  }
  requireUnique('daily role accountability ledger role', roleLedgerRows.map((row) => row.role));
  const roleLedgerByRole = new Map(roleLedgerRows.map((row) => [row.role, row]));
  const decisionQueueRows = parseDecisionQueueRows(dailyDecisionQueueTask);
  if (decisionQueueRows.length === 0) {
    errors.push('daily decision queue has no parsed rows');
  }
  requireUnique('daily decision queue item', decisionQueueRows.map((row) => row.queueItem));
  decisionQueueRows.forEach((row) => {
    [
      ['current owner', row.currentOwner],
      ['required decision or condition', row.requiredDecisionOrCondition],
      ['allowed first action after decision', row.allowedFirstActionAfterDecision],
      ['must remain blocked until', row.mustRemainBlockedUntil]
    ].forEach(([field, value]) => {
      if (!value.trim()) {
        errors.push(`daily decision queue item ${row.queueItem} missing ${field}`);
      }
    });
  });
  const decisionQueueItems = new Set(decisionQueueRows.map((row) => row.queueItem));
  const decisionCoverageRows = parseDecisionCoverageRows(dailyDecisionQueueTask);
  if (decisionCoverageRows.length === 0) {
    errors.push('daily decision queue has no parsed coverage rows');
  }
  requireUnique('daily decision queue coverage lane', decisionCoverageRows.map((row) => row.openStatusLane));
  const sessionCloseoutCoverageRows = parseSessionCloseoutCoverageRows(dailyDecisionQueueTask);
  if (sessionCloseoutCoverageRows.length === 0) {
    errors.push('daily decision queue has no parsed session closeout coverage rows');
  }
  requireUnique('daily decision queue session closeout item', sessionCloseoutCoverageRows.map((row) => row.queueItem));
  const decisionCoverageByLane = new Map(decisionCoverageRows.map((row) => [row.openStatusLane, row.queueCoverage]));
  const coveredDecisionQueueItems = new Set(decisionCoverageRows.map((row) => row.queueCoverage));
  const sessionCloseoutCoverageByItem = new Map(sessionCloseoutCoverageRows.map((row) => [row.queueItem, row.requiredCloseoutEvidence]));

  if (!statusJson.todayPlan || typeof statusJson.todayPlan !== 'object') {
    errors.push('status.json missing todayPlan registration');
  } else {
    if (statusJson.todayPlan.date !== '2026-07-06') {
      errors.push(`status.json todayPlan date mismatch: ${statusJson.todayPlan.date}`);
    }
    if (statusJson.todayPlan.session !== 'docs/orchestration/sessions/daily-closeout-2026-07-06.md') {
      errors.push(`status.json todayPlan session mismatch: ${statusJson.todayPlan.session}`);
    }
    if (!statusJson.todayPlan.selectedRoute?.trim()) {
      errors.push('status.json todayPlan selectedRoute is required');
    }
    ['session', 'progress'].forEach((key) => {
      const relativePath = statusJson.todayPlan[key];
      if (!relativePath) {
        errors.push(`status.json todayPlan missing ${key}`);
        return;
      }
      if (!exists(relativePath)) {
        errors.push(`status.json todayPlan ${key} path missing: ${relativePath}`);
      }
      if (!referencedMarkdownSet.has(relativePath)) {
        errors.push(`status.json todayPlan ${key} path is not tracked in index: ${relativePath}`);
      }
    });
  }

  if (!Array.isArray(statusJson.p0Cards)) {
    errors.push('status.json missing p0Cards array');
  } else {
    requireUnique('status.json P0 card id', statusJson.p0Cards.map((card) => card.id));
    const p0CardsById = new Map(statusJson.p0Cards.map((card) => [card.id, card]));
    requiredP0Cards.forEach((expected, id) => {
      const card = p0CardsById.get(id);
      if (!card) {
        errors.push(`status.json missing required P0 card: ${id}`);
        return;
      }
      if (!allowedP0Statuses.has(card.status)) {
        errors.push(`status.json P0 card ${id} has invalid status: ${card.status}`);
      }
      if (card.status !== expected.status) {
        errors.push(`status.json P0 card ${id} status mismatch: ${card.status} !== ${expected.status}`);
      }
      if (card.task !== expected.task) {
        errors.push(`status.json P0 card ${id} task mismatch: ${card.task} !== ${expected.task}`);
      }
      if (!exists(card.task)) {
        errors.push(`status.json P0 card ${id} task path missing: ${card.task}`);
      }
      if (!referencedMarkdownSet.has(card.task)) {
        errors.push(`status.json P0 card ${id} task path is not tracked in index: ${card.task}`);
      }
      if (expected.progress && card.progress !== expected.progress) {
        errors.push(`status.json P0 card ${id} progress mismatch: ${card.progress} !== ${expected.progress}`);
      }
      if (card.progress) {
        if (!exists(card.progress)) {
          errors.push(`status.json P0 card ${id} progress path missing: ${card.progress}`);
        }
        if (!referencedMarkdownSet.has(card.progress)) {
          errors.push(`status.json P0 card ${id} progress path is not tracked in index: ${card.progress}`);
        }
      }
    });
  }

  const dailySupervisionCloseout = [
    ['incomplete', parseBulletSection(dailySupervisionSession, 'incomplete:')],
    ['blockers', parseBulletSection(dailySupervisionSession, 'blockers:')],
    ['next action', parseBulletSection(dailySupervisionSession, 'next action:')]
  ];
  dailySupervisionCloseout.forEach(([label, items]) => {
    if (items.length === 0) {
      errors.push(`daily supervision closeout missing ${label} items`);
    }
  });
  const dailySupervisionCloseoutText = dailySupervisionCloseout.flatMap(([, items]) => items).join('\n');
  decisionCoverageRows.forEach((row) => {
    if (!decisionQueueItems.has(row.queueCoverage)) {
      errors.push(`daily decision queue coverage row points to missing queue item: ${row.openStatusLane} -> ${row.queueCoverage}`);
    }
  });
  sessionCloseoutCoverageRows.forEach((row) => {
    if (!decisionQueueItems.has(row.queueItem)) {
      errors.push(`daily decision queue session closeout coverage row points to missing queue item: ${row.queueItem}`);
    }
    const requiredPhrase = stripInlineCode(row.requiredCloseoutEvidence);
    if (!requiredPhrase.trim()) {
      errors.push(`daily decision queue session closeout coverage row missing evidence phrase: ${row.queueItem}`);
    }
    if (!dailySupervisionCloseoutText.includes(requiredPhrase)) {
      errors.push(`daily supervision session closeout missing queue item evidence: ${row.queueItem} -> ${requiredPhrase}`);
    }
  });
  decisionQueueRows.forEach((row) => {
    if (!coveredDecisionQueueItems.has(row.queueItem)) {
      errors.push(`daily decision queue item has no coverage lane: ${row.queueItem}`);
    }
    if (!sessionCloseoutCoverageByItem.has(row.queueItem)) {
      errors.push(`daily decision queue item has no session closeout coverage: ${row.queueItem}`);
    }
  });

  ['identity', 'loopState', 'dispatchState', 'target', 'source', 'blocker'].forEach((key) => {
    if (typeof statusJson[key] !== 'string' || statusJson[key].trim() === '') {
      errors.push(`status.json missing string field: ${key}`);
    }
  });

  if (!Array.isArray(statusJson.roles) || statusJson.roles.length === 0) {
    errors.push('status.json needs at least one role');
  } else {
    requireUnique('status.json role id', statusJson.roles.map((role) => role.id));
    requireUnique('status.json role title', statusJson.roles.map((role) => role.title));
    statusJson.roles.forEach((role, roleIndex) => {
      ['id', 'title', 'owner', 'responsibility', 'tag', 'evidence'].forEach((key) => {
        if (typeof role[key] !== 'string' || role[key].trim() === '') {
          errors.push(`status.json roles[${roleIndex}] missing string field: ${key}`);
        }
      });
      if (!allowedStates.has(role.status)) {
        errors.push(`status.json roles[${roleIndex}] has invalid status: ${role.status}`);
      }
      if (role.evidence && !exists(role.evidence)) {
        errors.push(`status.json roles[${roleIndex}] evidence missing: ${role.evidence}`);
      }
      if (role.title && !index.includes(`\`${role.title}\``)) {
        errors.push(`status.json roles[${roleIndex}] title is not listed in index current role split: ${role.title}`);
      }
      if (role.title && !dailyRoleAccountabilityTask.includes(`| \`${role.title}\` |`)) {
        errors.push(`daily role accountability ledger missing status role: ${role.title}`);
      }
      const roleLedgerRow = roleLedgerByRole.get(role.title);
      if (!roleLedgerRow) {
        errors.push(`daily role accountability ledger missing parsed status role: ${role.title}`);
      } else {
        if (roleLedgerRow.currentState !== role.status) {
          errors.push(`daily role accountability ledger state mismatch for ${role.title}: ${roleLedgerRow.currentState} !== ${role.status}`);
        }
        if (!roleLedgerRow.evidence.trim()) {
          errors.push(`daily role accountability ledger missing evidence for ${role.title}`);
        }
        if (!roleLedgerRow.accountabilityAction.trim()) {
          errors.push(`daily role accountability ledger missing action for ${role.title}`);
        }
      }
      if (role.evidence?.startsWith('docs/orchestration/') && role.evidence.endsWith('.md')) {
        if (!referencedMarkdownSet.has(role.evidence)) {
          errors.push(`status.json roles[${roleIndex}] evidence is not tracked in index: ${role.evidence}`);
        }
        const evidenceContent = read(role.evidence);
        if (role.tag && !evidenceContent.includes(role.tag)) {
          errors.push(`status.json roles[${roleIndex}] evidence does not contain tag ${role.tag}: ${role.evidence}`);
        }
      }
    });
  }

  if (!Array.isArray(statusJson.lanes) || statusJson.lanes.length === 0) {
    errors.push('status.json needs at least one lane');
  } else {
    requireUnique('status.json lane id', statusJson.lanes.map((lane) => lane.id));
    statusJson.lanes.forEach((lane, index) => {
      ['id', 'title', 'role', 'nextAction'].forEach((key) => {
        if (typeof lane[key] !== 'string' || lane[key].trim() === '') {
          errors.push(`status.json lanes[${index}] missing string field: ${key}`);
        }
      });
      if (!allowedStates.has(lane.state)) {
        errors.push(`status.json lanes[${index}] has invalid state: ${lane.state}`);
      }
    });
    const activeLaneIds = statusJson.lanes.filter((lane) => lane.state === 'active').map((lane) => lane.id).sort();
    const expectedActiveLaneIds = ['daily-supervision', 'weekly-requirements'].sort();
    if (JSON.stringify(activeLaneIds) !== JSON.stringify(expectedActiveLaneIds)) {
      errors.push(`status.json active lanes must remain daily-supervision + weekly-requirements after W27 opening: ${activeLaneIds.join(', ') || 'none'}`);
    }
  }

  const rolesByTitle = new Map((statusJson.roles ?? []).map((role) => [role.title, role]));
  const lanesByResponsibilityLabel = new Map(
    (statusJson.lanes ?? []).map((lane) => [`${lane.role} ${lane.id} lane`, lane])
  );
  const accountableRows = new Set(roleLedgerRows.map((row) => row.role));
  (statusJson.lanes ?? [])
    .filter((lane) => lane.state !== 'summarized')
    .forEach((lane) => {
      const label = `${lane.role} ${lane.id} lane`;
      if (!accountableRows.has(lane.role) && !accountableRows.has(label)) {
        errors.push(`daily role accountability ledger missing non-summarized lane owner or lane row: ${lane.id}`);
      }
    });
  roleLedgerRows.forEach((row) => {
    const role = rolesByTitle.get(row.role);
    const lane = lanesByResponsibilityLabel.get(row.role);
    if (!role && !lane) {
      errors.push(`daily role accountability ledger row does not resolve to a status role or lane: ${row.role}`);
      return;
    }
    if (!row.accountabilityAction.trim()) {
      errors.push(`daily role accountability ledger action is empty for ${row.role}`);
    }
    if (role && row.currentState !== role.status) {
      errors.push(`daily role accountability ledger state mismatch for role ${row.role}: ${row.currentState} !== ${role.status}`);
    }
    if (lane && row.currentState !== lane.state) {
      errors.push(`daily role accountability ledger state mismatch for lane ${row.role}: ${row.currentState} !== ${lane.state}`);
    }
    const evidencePaths = parseInlineCodeValues(row.evidence);
    if (evidencePaths.length === 0) {
      errors.push(`daily role accountability ledger evidence has no path for ${row.role}`);
    }
    evidencePaths.forEach((evidencePath) => {
      if (!exists(evidencePath)) {
        errors.push(`daily role accountability ledger evidence path missing for ${row.role}: ${evidencePath}`);
      }
      if (
        evidencePath.startsWith('docs/orchestration/') &&
        evidencePath.endsWith('.md') &&
        !referencedMarkdownSet.has(evidencePath)
      ) {
        errors.push(`daily role accountability ledger evidence markdown is not tracked for ${row.role}: ${evidencePath}`);
      }
    });
  });
  decisionQueueRows.forEach((row) => {
    if (!rolesByTitle.has(row.currentOwner)) {
      errors.push(`daily decision queue item ${row.queueItem} owner is not a tracked status role: ${row.currentOwner}`);
    }
  });
  const sharedControlRoleIds = new Set(['pm', 'supervisor']);
  (statusJson.lanes ?? []).forEach((lane, index) => {
    const role = rolesByTitle.get(lane.role);
    if (role && !sharedControlRoleIds.has(role.id) && lane.state !== role.status) {
      errors.push(`status.json lanes[${index}] state ${lane.state} does not match role ${role.title} status ${role.status}`);
    }
  });
  const openDecisionLaneCoverage = new Map([
    ['connector-policy', 'Connector acceptance'],
    ['connector-acceptance-review', 'Connector acceptance'],
    ['live-subagents', 'Live sub-agent quota'],
    ['git-manager-agentpet', 'AgentPet Git state review'],
    ['git-repair-agentpet', 'AgentPet Git repair'],
    ['git-staging-review-agentpet', 'AgentPet Git state review'],
    ['ranch-pointer-smoke', 'Transparent pointer smoke'],
    ['ranch-pointer-smoke-manual-evidence', 'Transparent pointer smoke'],
    ['homepage-ui-design', 'Homepage UI long-worker dispatch'],
    ['ranch-real-integration-r0-3-dryrun', 'R0-3 Codex dry-run authorization']
  ]);
  const nonDecisionOpenLanes = new Set(['daily-decision-queue', 'daily-role-accountability']);
  const statusLanesById = new Map((statusJson.lanes ?? []).map((lane) => [lane.id, lane]));
  decisionCoverageRows.forEach((row) => {
    const lane = statusLanesById.get(row.openStatusLane);
    if (!lane) {
      errors.push(`daily decision queue coverage row points to missing status lane: ${row.openStatusLane}`);
      return;
    }
    if (!['standby', 'blocked'].includes(lane.state) || nonDecisionOpenLanes.has(lane.id)) {
      errors.push(`daily decision queue coverage row is not an open decision lane: ${row.openStatusLane} [${lane.state}]`);
    }
  });
  (statusJson.lanes ?? [])
    .filter((lane) => ['standby', 'blocked'].includes(lane.state))
    .forEach((lane) => {
      if (nonDecisionOpenLanes.has(lane.id)) {
        return;
      }
      const queueCoverage = openDecisionLaneCoverage.get(lane.id);
      if (!queueCoverage) {
        errors.push(`daily decision queue missing coverage rule for open lane: ${lane.id}`);
        return;
      }
      const parsedCoverage = decisionCoverageByLane.get(lane.id);
      if (!parsedCoverage) {
        errors.push(`daily decision queue coverage guard missing parsed row for open lane: ${lane.id}`);
        return;
      }
      if (parsedCoverage !== queueCoverage) {
        errors.push(`daily decision queue coverage mismatch for open lane ${lane.id}: ${parsedCoverage} !== ${queueCoverage}`);
      }
      const requiredRow = `| ${lane.id} | ${queueCoverage} |`;
      if (!dailyDecisionQueueTask.includes(requiredRow)) {
        errors.push(`daily decision queue coverage guard missing row for ${lane.id}: ${requiredRow}`);
      }
    });

  if (!statusJson.roles?.some((role) => role.tag === '⟦tag:v2|role|pm-control-v0.1⟧')) {
    errors.push('status.json missing PM role tag');
  }
  if (!statusJson.roles?.some((role) => role.tag === '⟦tag:v2|role|supervisor-control-v0.1⟧')) {
    errors.push('status.json missing supervisor role tag');
  }
  if (!statusJson.roles?.some((role) => role.tag === '⟦tag:v2|task|connector-policy-v0.1⟧')) {
    errors.push('status.json missing connector policy lane role');
  }

  const dailyDecisionQueueRole = statusJson.roles?.find((role) => role.id === 'daily-decision-queue');
  if (!dailyDecisionQueueRole) {
    errors.push('status.json missing daily decision queue role');
  } else {
    if (dailyDecisionQueueRole.title !== '[PM]#daily-decision-queue@2026-07-02') {
      errors.push(`daily decision queue role title mismatch: ${dailyDecisionQueueRole.title}`);
    }
    if (dailyDecisionQueueRole.status !== 'standby') {
      errors.push(`daily decision queue must remain standby: ${dailyDecisionQueueRole.status}`);
    }
    if (dailyDecisionQueueRole.evidence !== 'docs/orchestration/tasks/daily-decision-queue-2026-07-02.md') {
      errors.push(`daily decision queue evidence mismatch: ${dailyDecisionQueueRole.evidence}`);
    }
  }

  const dailyDecisionQueueLane = statusJson.lanes?.find((lane) => lane.id === 'daily-decision-queue');
  if (!dailyDecisionQueueLane) {
    errors.push('status.json missing daily decision queue lane');
  } else if (dailyDecisionQueueLane.state !== 'standby') {
    errors.push(`daily decision queue lane must remain standby: ${dailyDecisionQueueLane.state}`);
  }

  const dailyRoleAccountabilityRole = statusJson.roles?.find((role) => role.id === 'daily-role-accountability');
  if (!dailyRoleAccountabilityRole) {
    errors.push('status.json missing daily role accountability role');
  } else {
    if (dailyRoleAccountabilityRole.title !== '[PM]#daily-role-accountability@2026-07-02') {
      errors.push(`daily role accountability role title mismatch: ${dailyRoleAccountabilityRole.title}`);
    }
    if (dailyRoleAccountabilityRole.status !== 'standby') {
      errors.push(`daily role accountability role must remain standby: ${dailyRoleAccountabilityRole.status}`);
    }
    if (dailyRoleAccountabilityRole.evidence !== 'docs/orchestration/tasks/daily-role-accountability-2026-07-02.md') {
      errors.push(`daily role accountability evidence mismatch: ${dailyRoleAccountabilityRole.evidence}`);
    }
  }

  const dailyRoleAccountabilityLane = statusJson.lanes?.find((lane) => lane.id === 'daily-role-accountability');
  if (!dailyRoleAccountabilityLane) {
    errors.push('status.json missing daily role accountability lane');
  } else if (dailyRoleAccountabilityLane.state !== 'standby') {
    errors.push(`daily role accountability lane must remain standby: ${dailyRoleAccountabilityLane.state}`);
  }

  const connectorAcceptanceReviewRole = statusJson.roles?.find((role) => role.id === 'connector-acceptance-review');
  if (!connectorAcceptanceReviewRole) {
    errors.push('status.json missing connector acceptance review role');
  } else {
    if (connectorAcceptanceReviewRole.title !== '[PM]#connector-acceptance-review@v0.1') {
      errors.push(`connector acceptance review role title mismatch: ${connectorAcceptanceReviewRole.title}`);
    }
    if (connectorAcceptanceReviewRole.status !== 'standby') {
      errors.push(`connector acceptance review role must remain standby until PM/user decision: ${connectorAcceptanceReviewRole.status}`);
    }
    if (connectorAcceptanceReviewRole.evidence !== 'docs/orchestration/tasks/connector-acceptance-review-v0.1.md') {
      errors.push(`connector acceptance review evidence mismatch: ${connectorAcceptanceReviewRole.evidence}`);
    }
  }

  const connectorAcceptanceReviewLane = statusJson.lanes?.find((lane) => lane.id === 'connector-acceptance-review');
  if (!connectorAcceptanceReviewLane) {
    errors.push('status.json missing connector acceptance review lane');
  } else if (connectorAcceptanceReviewLane.state !== 'standby') {
    errors.push(`connector acceptance review lane must remain standby until PM/user decision: ${connectorAcceptanceReviewLane.state}`);
  }

  const gitManagerRole = statusJson.roles?.find((role) => role.id === 'git-manager-agentpet');
  if (!gitManagerRole) {
    errors.push('status.json missing AgentPet Git manager role');
  } else {
    if (gitManagerRole.title !== '[长工]#git-manager@AgentPet') {
      errors.push(`AgentPet Git manager role title mismatch: ${gitManagerRole.title}`);
    }
    if (gitManagerRole.status !== 'standby') {
      errors.push(`AgentPet Git manager role must remain standby after post-push callback request: ${gitManagerRole.status}`);
    }
    if (gitManagerRole.evidence !== 'docs/orchestration/sessions/git-manager-agentpet-2026-07-02.md') {
      errors.push(`AgentPet Git manager evidence mismatch: ${gitManagerRole.evidence}`);
    }
  }

  const gitManagerLane = statusJson.lanes?.find((lane) => lane.id === 'git-manager-agentpet');
  if (!gitManagerLane) {
    errors.push('status.json missing AgentPet Git manager lane');
  } else if (gitManagerLane.state !== 'standby') {
    errors.push(`AgentPet Git manager lane must remain standby after post-push callback request: ${gitManagerLane.state}`);
  }

  const gitRepairRole = statusJson.roles?.find((role) => role.id === 'git-repair-agentpet');
  if (!gitRepairRole) {
    errors.push('status.json missing AgentPet Git repair role');
  } else {
    if (gitRepairRole.title !== '[短工]#git-repair-agentpet@v0.1') {
      errors.push(`AgentPet Git repair role title mismatch: ${gitRepairRole.title}`);
    }
    if (gitRepairRole.status !== 'standby') {
      errors.push(`AgentPet Git repair role must remain standby until repair is authorized: ${gitRepairRole.status}`);
    }
    if (gitRepairRole.evidence !== 'docs/orchestration/tasks/git-repair-agentpet-v0.1.md') {
      errors.push(`AgentPet Git repair evidence mismatch: ${gitRepairRole.evidence}`);
    }
  }

  const gitRepairLane = statusJson.lanes?.find((lane) => lane.id === 'git-repair-agentpet');
  if (!gitRepairLane) {
    errors.push('status.json missing AgentPet Git repair lane');
  } else if (gitRepairLane.state !== 'standby') {
    errors.push(`AgentPet Git repair lane must remain standby until repair is authorized: ${gitRepairLane.state}`);
  }

  const gitStagingReviewRole = statusJson.roles?.find((role) => role.id === 'git-staging-review-agentpet');
  if (!gitStagingReviewRole) {
    errors.push('status.json missing AgentPet Git staging review role');
  } else {
    if (gitStagingReviewRole.title !== '[PM]#git-staging-review-agentpet@v0.1') {
      errors.push(`AgentPet Git staging review role title mismatch: ${gitStagingReviewRole.title}`);
    }
    if (gitStagingReviewRole.status !== 'standby') {
      errors.push(`AgentPet Git staging review role must remain standby until review is authorized: ${gitStagingReviewRole.status}`);
    }
    if (gitStagingReviewRole.evidence !== 'docs/orchestration/tasks/git-staging-review-agentpet-v0.1.md') {
      errors.push(`AgentPet Git staging review evidence mismatch: ${gitStagingReviewRole.evidence}`);
    }
  }

  const gitStagingReviewLane = statusJson.lanes?.find((lane) => lane.id === 'git-staging-review-agentpet');
  if (!gitStagingReviewLane) {
    errors.push('status.json missing AgentPet Git staging review lane');
  } else if (gitStagingReviewLane.state !== 'standby') {
    errors.push(`AgentPet Git staging review lane must remain standby until review is authorized: ${gitStagingReviewLane.state}`);
  }

  const ranchM4RequirementsRole = statusJson.roles?.find((role) => role.id === 'ranch-m4-requirements');
  if (!ranchM4RequirementsRole) {
    errors.push('status.json missing ranch M4 requirements role');
  } else if (ranchM4RequirementsRole.status !== 'summarized') {
    errors.push(`ranch M4 requirements role must be summarized after dispatch package creation: ${ranchM4RequirementsRole.status}`);
  }

  const ranchM4ImplementationRole = statusJson.roles?.find((role) => role.id === 'ranch-m4-implementation');
  if (!ranchM4ImplementationRole) {
    errors.push('status.json missing ranch M4 implementation role');
  } else if (ranchM4ImplementationRole.status !== 'summarized') {
    errors.push(`ranch M4 implementation role must be summarized after PM acceptance: ${ranchM4ImplementationRole.status}`);
  }

  const ranchM4ImplementationLane = statusJson.lanes?.find((lane) => lane.id === 'ranch-m4-implementation');
  if (!ranchM4ImplementationLane) {
    errors.push('status.json missing ranch M4 implementation lane');
  } else if (ranchM4ImplementationLane.state !== 'summarized') {
    errors.push(`ranch M4 implementation lane must be summarized after PM acceptance: ${ranchM4ImplementationLane.state}`);
  }

  const ranchPointerSmokeRole = statusJson.roles?.find((role) => role.id === 'ranch-pointer-smoke');
  if (!ranchPointerSmokeRole) {
    errors.push('status.json missing ranch pointer smoke role');
  } else if (ranchPointerSmokeRole.status !== 'standby') {
    errors.push(`ranch pointer smoke role must remain standby until a transparent-window capture route is available: ${ranchPointerSmokeRole.status}`);
  }

  const ranchPointerSmokeLane = statusJson.lanes?.find((lane) => lane.id === 'ranch-pointer-smoke');
  if (!ranchPointerSmokeLane) {
    errors.push('status.json missing ranch pointer smoke lane');
  } else if (ranchPointerSmokeLane.state !== 'standby') {
    errors.push(`ranch pointer smoke lane must remain standby until a transparent-window capture route is available: ${ranchPointerSmokeLane.state}`);
  }

  const ranchPointerSmokeManualEvidenceRole = statusJson.roles?.find((role) => role.id === 'ranch-pointer-smoke-manual-evidence');
  if (!ranchPointerSmokeManualEvidenceRole) {
    errors.push('status.json missing ranch pointer smoke manual evidence role');
  } else {
    if (ranchPointerSmokeManualEvidenceRole.title !== '[监督]#ranch-pointer-smoke-manual-evidence@v0.2') {
      errors.push(`ranch pointer smoke manual evidence role title mismatch: ${ranchPointerSmokeManualEvidenceRole.title}`);
    }
    if (ranchPointerSmokeManualEvidenceRole.status !== 'standby') {
      errors.push(`ranch pointer smoke manual evidence role must remain standby until a transparent-window capture route is available: ${ranchPointerSmokeManualEvidenceRole.status}`);
    }
    if (ranchPointerSmokeManualEvidenceRole.evidence !== 'docs/orchestration/tasks/ranch-pointer-smoke-manual-evidence-v0.2.md') {
      errors.push(`ranch pointer smoke manual evidence mismatch: ${ranchPointerSmokeManualEvidenceRole.evidence}`);
    }
  }

  const ranchPointerSmokeManualEvidenceLane = statusJson.lanes?.find((lane) => lane.id === 'ranch-pointer-smoke-manual-evidence');
  if (!ranchPointerSmokeManualEvidenceLane) {
    errors.push('status.json missing ranch pointer smoke manual evidence lane');
  } else if (ranchPointerSmokeManualEvidenceLane.state !== 'standby') {
    errors.push(`ranch pointer smoke manual evidence lane must remain standby until a transparent-window capture route is available: ${ranchPointerSmokeManualEvidenceLane.state}`);
  }

  if (statusJson.source !== 'docs/orchestration/index.md') {
    errors.push(`status.json source must be docs/orchestration/index.md, got: ${statusJson.source}`);
  }
  if (indexState.identity && statusJson.identity !== indexState.identity) {
    errors.push(`status.json identity ${statusJson.identity} does not match index identity ${indexState.identity}`);
  }
  if (indexState.loopState && statusJson.loopState !== indexState.loopState) {
    errors.push(`status.json loopState ${statusJson.loopState} does not match index loop state ${indexState.loopState}`);
  }
  if (indexState.dispatchState && statusJson.dispatchState !== indexState.dispatchState) {
    errors.push(`status.json dispatchState ${statusJson.dispatchState} does not match index dispatch state ${indexState.dispatchState}`);
  }
  if (statusJson.target && !index.includes(statusJson.target)) {
    errors.push('status.json target is not present in docs/orchestration/index.md current target');
  }
  if (index.includes('403 DAILY_LIMIT_EXCEEDED') && !statusJson.blocker.includes('403 DAILY_LIMIT_EXCEEDED')) {
    errors.push('status.json blocker must include live-subagent 403 DAILY_LIMIT_EXCEEDED when index lists it');
  }

  if (!Array.isArray(statusJson.connectors) || statusJson.connectors.length === 0) {
    errors.push('status.json needs connector policy entries');
  } else {
    const allowedConnectorStatuses = new Set(['draft', 'placeholder', 'ready', 'disabled']);
    requireUnique('status.json connector id', statusJson.connectors.map((connector) => connector.id));
    statusJson.connectors.forEach((connector, index) => {
      ['id', 'label', 'cwdPolicy', 'confirmation', 'acceptanceGate'].forEach((key) => {
        if (typeof connector[key] !== 'string' || connector[key].trim() === '') {
          errors.push(`status.json connectors[${index}] missing string field: ${key}`);
        }
      });
      if (!allowedConnectorStatuses.has(connector.status)) {
        errors.push(`status.json connectors[${index}] has invalid status: ${connector.status}`);
      }
      if (!Array.isArray(connector.envAllowlist)) {
        errors.push(`status.json connectors[${index}] envAllowlist must be an array`);
      }
      if (typeof connector.timeoutSeconds !== 'number' || connector.timeoutSeconds <= 0) {
        errors.push(`status.json connectors[${index}] timeoutSeconds must be positive`);
      }
    });
  }

  const sessionStatesByPath = new Map();
  const expectedStatesByIdentity = new Map();
  const addExpectedState = (map, key, state) => {
    if (!key || !state) {
      return;
    }
    const states = map.get(key) ?? [];
    states.push(state);
    map.set(key, states);
  };

  (statusJson.roles ?? []).forEach((role) => {
    addExpectedState(expectedStatesByIdentity, role.title, role.status);
    if (role.evidence?.startsWith('docs/orchestration/sessions/')) {
      addExpectedState(sessionStatesByPath, role.evidence, role.status);
    }
  });
  (statusJson.lanes ?? []).forEach((lane) => {
    addExpectedState(expectedStatesByIdentity, lane.role, lane.state);
  });

  const statusRoleTitles = new Set((statusJson.roles ?? []).map((role) => role.title));
  const trackedSessionIdentities = new Set();

  referencedSessions.forEach((relativePath) => {
    const content = read(relativePath);
    const sessionState = parseSessionState(relativePath, content);
    if (sessionState.identity) {
      trackedSessionIdentities.add(sessionState.identity);
    }
    const expectedStates = [
      ...(sessionStatesByPath.get(relativePath) ?? []),
      ...(expectedStatesByIdentity.get(sessionState.identity) ?? [])
    ];
    const expectedState = strongestExpectedState([...new Set(expectedStates)]);

    if (expectedState) {
      if (sessionState.loopState !== expectedState) {
        errors.push(`${relativePath} loop state ${sessionState.loopState} does not match status source ${expectedState}`);
      }
      if (sessionState.dispatchState !== expectedState) {
        errors.push(`${relativePath} dispatch state ${sessionState.dispatchState} does not match status source ${expectedState}`);
      }
    } else if (sessionState.loopState === 'active' || sessionState.dispatchState === 'active') {
      errors.push(`${relativePath} is active but is not mapped to an active status role or lane`);
    }
  });

  (statusJson.lanes ?? []).forEach((lane, index) => {
    if (!statusRoleTitles.has(lane.role) && !trackedSessionIdentities.has(lane.role)) {
      errors.push(`status.json lanes[${index}] role is not tracked as a role or session identity: ${lane.role}`);
    }
  });
}

if (connectorSchema) {
  requireText('connector schema', JSON.stringify(connectorSchema), [
    'Multi Agent Connector Policy',
    'enabledByDefault',
    'approvalStatus',
    'acceptedBy',
    'dangerousCommandPatterns',
    'required-for-write'
  ]);
}

if (connectorConfig) {
  const connectorStatuses = new Set(['draft', 'placeholder', 'ready', 'disabled']);
  const confirmations = new Set(['none', 'required', 'required-for-write']);
  const cwdPolicies = new Set(['workspace-root', 'explicit-path']);
  const approvalStatuses = new Set(['not-requested', 'pending', 'accepted', 'rejected']);

  if (connectorConfig.version !== 1) {
    errors.push('connectors.json version must be 1');
  }
  if (!connectorConfig.defaults || typeof connectorConfig.defaults !== 'object') {
    errors.push('connectors.json missing defaults');
  } else {
    if (!cwdPolicies.has(connectorConfig.defaults.cwdPolicy)) {
      errors.push(`connectors.json defaults invalid cwdPolicy: ${connectorConfig.defaults.cwdPolicy}`);
    }
    if (!Array.isArray(connectorConfig.defaults.envAllowlist) || connectorConfig.defaults.envAllowlist.length === 0) {
      errors.push('connectors.json defaults envAllowlist must be non-empty');
    }
    if (!confirmations.has(connectorConfig.defaults.confirmation)) {
      errors.push(`connectors.json defaults invalid confirmation: ${connectorConfig.defaults.confirmation}`);
    }
    if (!Array.isArray(connectorConfig.defaults.dangerousCommandPatterns) || connectorConfig.defaults.dangerousCommandPatterns.length === 0) {
      errors.push('connectors.json defaults dangerousCommandPatterns must be non-empty');
    }
  }

  if (!Array.isArray(connectorConfig.connectors) || connectorConfig.connectors.length === 0) {
    errors.push('connectors.json needs connectors');
  } else {
    const ids = new Set();
    connectorConfig.connectors.forEach((connector, index) => {
      ['id', 'label', 'runner', 'cwdPolicy', 'confirmation', 'acceptanceGate', 'approvalStatus', 'acceptedBy', 'acceptedAt', 'approvalEvidence'].forEach((key) => {
        if (typeof connector[key] !== 'string' || connector[key].trim() === '') {
          const optionalUntilAccepted = ['acceptedBy', 'acceptedAt'].includes(key) && connector.approvalStatus !== 'accepted';
          if (!optionalUntilAccepted) {
            errors.push(`connectors.json connectors[${index}] missing string field: ${key}`);
          }
        }
      });
      if (ids.has(connector.id)) {
        errors.push(`connectors.json duplicate connector id: ${connector.id}`);
      }
      ids.add(connector.id);
      if (!connectorStatuses.has(connector.status)) {
        errors.push(`connectors.json connectors[${index}] invalid status: ${connector.status}`);
      }
      if (connector.runner !== 'local-command') {
        errors.push(`connectors.json connectors[${index}] invalid runner: ${connector.runner}`);
      }
      if (!Array.isArray(connector.args)) {
        errors.push(`connectors.json connectors[${index}] args must be an array`);
      }
      if (!cwdPolicies.has(connector.cwdPolicy)) {
        errors.push(`connectors.json connectors[${index}] invalid cwdPolicy: ${connector.cwdPolicy}`);
      }
      if (!Array.isArray(connector.envAllowlist) || connector.envAllowlist.length === 0) {
        errors.push(`connectors.json connectors[${index}] envAllowlist must be non-empty`);
      }
      if (!confirmations.has(connector.confirmation)) {
        errors.push(`connectors.json connectors[${index}] invalid confirmation: ${connector.confirmation}`);
      }
      if (!approvalStatuses.has(connector.approvalStatus)) {
        errors.push(`connectors.json connectors[${index}] invalid approvalStatus: ${connector.approvalStatus}`);
      }
      if (typeof connector.timeoutSeconds !== 'number' || connector.timeoutSeconds <= 0) {
        errors.push(`connectors.json connectors[${index}] timeoutSeconds must be positive`);
      }
      if (typeof connector.enabledByDefault !== 'boolean') {
        errors.push(`connectors.json connectors[${index}] enabledByDefault must be boolean`);
      }
      if (connector.enabledByDefault && connector.status !== 'ready') {
        errors.push(`connectors.json connector ${connector.id} cannot be enabled unless status is ready`);
      }
      if (connector.enabledByDefault && connector.approvalStatus !== 'accepted') {
        errors.push(`connectors.json connector ${connector.id} cannot be enabled unless approvalStatus is accepted`);
      }
      if (connector.approvalStatus === 'accepted' && connector.status !== 'ready') {
        errors.push(`connectors.json connector ${connector.id} cannot be accepted unless status is ready`);
      }
      if (connector.approvalStatus === 'accepted' && (!connector.acceptedBy.trim() || !connector.acceptedAt.trim())) {
        errors.push(`connectors.json accepted connector ${connector.id} needs acceptedBy and acceptedAt`);
      }
      if (connector.status === 'placeholder' && connector.command.trim() !== '') {
        errors.push(`connectors.json placeholder connector ${connector.id} must not define command`);
      }
      if (['draft', 'ready'].includes(connector.status) && connector.command.trim() === '') {
        errors.push(`connectors.json ${connector.status} connector ${connector.id} needs command`);
      }
    });
  }
}

if (statusJson && connectorConfig?.connectors) {
  const configConnectorsById = new Map(connectorConfig.connectors.map((connector) => [connector.id, connector]));
  const configIds = new Set(configConnectorsById.keys());
  const statusIds = new Set((statusJson.connectors ?? []).map((connector) => connector.id));
  configIds.forEach((id) => {
    if (!statusIds.has(id)) {
      errors.push(`status.json missing connector from connectors.json: ${id}`);
    }
  });
  statusIds.forEach((id) => {
    if (!configIds.has(id)) {
      errors.push(`status.json has connector missing from connectors.json: ${id}`);
    }
  });
  (statusJson.connectors ?? []).forEach((statusConnector) => {
    const configConnector = configConnectorsById.get(statusConnector.id);
    if (!configConnector) {
      return;
    }
    [
      'label',
      'status',
      'command',
      'cwdPolicy',
      'envAllowlist',
      'confirmation',
      'timeoutSeconds',
      'acceptanceGate'
    ].forEach((field) => {
      requireSameValue(`connector ${statusConnector.id} ${field}`, statusConnector[field], configConnector[field]);
    });
  });
}

if (packageJson) {
  if (packageJson.scripts?.['orchestration:report'] !== 'node scripts/orchestration-report.mjs') {
    errors.push('package.json missing orchestration:report script');
  }
  if (packageJson.scripts?.['orchestration:check'] !== 'node scripts/check-orchestration.mjs') {
    errors.push('package.json missing orchestration:check script');
  }
  if (packageJson.scripts?.['orchestration:preflight'] !== 'node scripts/connector-preflight.mjs') {
    errors.push('package.json missing orchestration:preflight script');
  }
  if (packageJson.scripts?.['orchestration:connector-safety'] !== 'node scripts/check-connector-gate.mjs && node scripts/check-preload-connector-api.mjs && node scripts/check-ui-connector-status-only.mjs') {
    errors.push('package.json missing orchestration:connector-safety script');
  }
}

if (errors.length > 0) {
  console.error('Orchestration check failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Orchestration check passed.');
console.log(`Referenced cards: ${referencedMarkdown.length}`);
