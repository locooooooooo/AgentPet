import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const statusPath = path.join(root, 'docs/orchestration/status.json');
const connectorsPath = path.join(root, 'docs/orchestration/connectors.json');
const indexPath = path.join(root, 'docs/orchestration/index.md');
const dailySupervisionPath = path.join(root, 'docs/orchestration/sessions/daily-supervision-2026-07-02.md');
const dailyDecisionQueuePath = path.join(root, 'docs/orchestration/tasks/daily-decision-queue-2026-07-02.md');
const dailyRoleAccountabilityPath = path.join(root, 'docs/orchestration/tasks/daily-role-accountability-2026-07-02.md');

const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
const connectorPolicy = JSON.parse(fs.readFileSync(connectorsPath, 'utf8'));
const index = fs.readFileSync(indexPath, 'utf8');
const dailySupervision = fs.readFileSync(dailySupervisionPath, 'utf8');
const dailyDecisionQueue = fs.readFileSync(dailyDecisionQueuePath, 'utf8');
const dailyRoleAccountability = fs.readFileSync(dailyRoleAccountabilityPath, 'utf8');
const trackedCardMatches = [...new Set(
  [...index.matchAll(/`(docs\/orchestration\/[^`]+\.md)`/g)].map((match) => match[1])
)];
const todayPlan = status.todayPlan ?? null;
const p0Cards = Array.isArray(status.p0Cards) ? status.p0Cards : [];
const decisionQueueRows = parseDecisionQueueRows(dailyDecisionQueue);
if (decisionQueueRows.length === 0) {
  throw new Error('daily decision queue has no parsed items');
}
const decisionCoverageRows = parseDecisionCoverageRows(dailyDecisionQueue);
if (decisionCoverageRows.length === 0) {
  throw new Error('daily decision queue has no parsed coverage rows');
}
const sessionCloseoutCoverageRows = parseSessionCloseoutCoverageRows(dailyDecisionQueue);
if (sessionCloseoutCoverageRows.length === 0) {
  throw new Error('daily decision queue has no parsed session closeout coverage rows');
}
const roleAccountabilityRows = parseRoleAccountabilityRows(dailyRoleAccountability);
if (roleAccountabilityRows.length === 0) {
  throw new Error('daily role accountability ledger has no parsed items');
}
const dailySupervisionCloseout = [
  ['incomplete', parseBulletSection(dailySupervision, 'incomplete:')],
  ['blockers', parseBulletSection(dailySupervision, 'blockers:')],
  ['next action', parseBulletSection(dailySupervision, 'next action:')]
];
dailySupervisionCloseout.forEach(([label, items]) => {
  if (items.length === 0) {
    throw new Error(`daily supervision closeout missing ${label} items`);
  }
});
const dailySupervisionCloseoutText = dailySupervisionCloseout.flatMap(([, items]) => items).join('\n');
requireUnique('daily decision queue item', decisionQueueRows.map((row) => row.queueItem));
decisionQueueRows.forEach((row) => {
  [
    ['current owner', row.currentOwner],
    ['required decision or condition', row.requiredDecisionOrCondition],
    ['allowed first action after decision', row.allowedFirstActionAfterDecision],
    ['must remain blocked until', row.mustRemainBlockedUntil]
  ].forEach(([field, value]) => {
    if (!value.trim()) {
      throw new Error(`daily decision queue report item ${row.queueItem} missing ${field}`);
    }
  });
});
const statusRolesByTitle = new Map(status.roles.map((role) => [role.title, role]));
decisionQueueRows.forEach((row) => {
  if (!statusRolesByTitle.has(stripInlineCode(row.currentOwner))) {
    throw new Error(`daily decision queue report owner is not a tracked status role: ${row.queueItem} -> ${row.currentOwner}`);
  }
});
requireUnique('daily decision queue coverage lane', decisionCoverageRows.map((row) => row.openStatusLane));
requireUnique('daily decision queue session closeout item', sessionCloseoutCoverageRows.map((row) => row.queueItem));
const decisionQueueItems = new Set(decisionQueueRows.map((row) => row.queueItem));
const decisionCoverageByLane = new Map(decisionCoverageRows.map((row) => [row.openStatusLane, row.queueCoverage]));
const coveredDecisionQueueItems = new Set(decisionCoverageRows.map((row) => row.queueCoverage));
const sessionCloseoutCoverageByItem = new Map(sessionCloseoutCoverageRows.map((row) => [row.queueItem, row.requiredCloseoutEvidence]));
decisionCoverageRows.forEach((row) => {
  if (!decisionQueueItems.has(row.queueCoverage)) {
    throw new Error(`daily decision queue report coverage points to missing item: ${row.openStatusLane} -> ${row.queueCoverage}`);
  }
});
sessionCloseoutCoverageRows.forEach((row) => {
  if (!decisionQueueItems.has(row.queueItem)) {
    throw new Error(`daily decision queue report session closeout coverage points to missing item: ${row.queueItem}`);
  }
  const requiredPhrase = stripInlineCode(row.requiredCloseoutEvidence);
  if (!requiredPhrase.trim()) {
    throw new Error(`daily decision queue report session closeout coverage missing evidence phrase: ${row.queueItem}`);
  }
  if (!dailySupervisionCloseoutText.includes(requiredPhrase)) {
    throw new Error(`daily supervision closeout missing queue item evidence: ${row.queueItem} -> ${requiredPhrase}`);
  }
});
decisionQueueRows.forEach((row) => {
  if (!coveredDecisionQueueItems.has(row.queueItem)) {
    throw new Error(`daily decision queue report item has no coverage lane: ${row.queueItem}`);
  }
  if (!sessionCloseoutCoverageByItem.has(row.queueItem)) {
    throw new Error(`daily decision queue report item has no session closeout coverage: ${row.queueItem}`);
  }
});
const expectedDecisionCoverageByLane = new Map([
  ['connector-policy', 'Connector acceptance'],
  ['connector-acceptance-review', 'Connector acceptance'],
  ['live-subagents', 'Live sub-agent quota'],
  ['git-manager-agentpet', 'AgentPet Git state review'],
  ['git-repair-agentpet', 'AgentPet Git repair'],
  ['git-staging-review-agentpet', 'AgentPet Git state review'],
  ['ranch-pointer-smoke', 'Transparent pointer smoke'],
  ['ranch-pointer-smoke-manual-evidence', 'Transparent pointer smoke'],
  ['ranch-real-integration-r0-3-dryrun', 'R0-3 Codex dry-run authorization'],
  ['homepage-ui-design', 'Homepage UI long-worker dispatch'],
  ['protected-cockpit-source-drift', 'Protected cockpit source drift']
]);
const nonDecisionOpenLanes = new Set(['daily-decision-queue', 'daily-role-accountability']);
const statusLanesById = new Map(status.lanes.map((lane) => [lane.id, lane]));
const activeLaneIds = status.lanes.filter((lane) => lane.state === 'active').map((lane) => lane.id).sort();
const expectedActiveLaneIds = ['daily-supervision', 'weekly-requirements'].sort();
const expectedActiveLaneLine = 'expected active lane: daily-supervision, weekly-requirements';
if (JSON.stringify(activeLaneIds) !== JSON.stringify(expectedActiveLaneIds)) {
  throw new Error(`active lanes must remain daily-supervision + weekly-requirements after W27 opening: ${activeLaneIds.join(', ') || 'none'}`);
}
decisionCoverageRows.forEach((row) => {
  const lane = statusLanesById.get(row.openStatusLane);
  if (!lane) {
    throw new Error(`daily decision queue report coverage points to missing status lane: ${row.openStatusLane}`);
  }
  if (!['standby', 'blocked'].includes(lane.state) || nonDecisionOpenLanes.has(lane.id)) {
    throw new Error(`daily decision queue report coverage is not an open decision lane: ${row.openStatusLane} [${lane.state}]`);
  }
});
status.lanes
  .filter((lane) => ['standby', 'blocked'].includes(lane.state))
  .forEach((lane) => {
    if (nonDecisionOpenLanes.has(lane.id)) {
      return;
    }
    const expectedCoverage = expectedDecisionCoverageByLane.get(lane.id);
    if (!expectedCoverage) {
      throw new Error(`daily decision queue report missing coverage rule for open lane: ${lane.id}`);
    }
    const parsedCoverage = decisionCoverageByLane.get(lane.id);
    if (!parsedCoverage) {
      throw new Error(`daily decision queue report missing coverage row for open lane: ${lane.id}`);
    }
    if (parsedCoverage !== expectedCoverage) {
      throw new Error(`daily decision queue report coverage mismatch for open lane ${lane.id}: ${parsedCoverage} !== ${expectedCoverage}`);
    }
  });
const accountableRoles = new Set(roleAccountabilityRows.map((item) => stripInlineCode(item.role)));
status.roles.forEach((role) => {
  if (!accountableRoles.has(role.title)) {
    throw new Error(`daily role accountability report missing status role: ${role.title}`);
  }
});
const lanesByResponsibilityLabel = new Map(
  status.lanes.map((lane) => [`${lane.role} ${lane.id} lane`, lane])
);
status.lanes
  .filter((lane) => lane.state !== 'summarized')
  .forEach((lane) => {
    const label = `${lane.role} ${lane.id} lane`;
    if (!accountableRoles.has(lane.role) && !accountableRoles.has(label)) {
      throw new Error(`daily role accountability report missing non-summarized lane owner or lane row: ${lane.id}`);
    }
  });
roleAccountabilityRows.forEach((item) => {
  const role = status.roles.find((statusRole) => statusRole.title === stripInlineCode(item.role));
  const lane = lanesByResponsibilityLabel.get(stripInlineCode(item.role));
  if (!role && !lane) {
    throw new Error(`daily role accountability report row does not resolve to status role or lane: ${item.role}`);
  }
  if (role && item.currentState !== role.status) {
    throw new Error(`daily role accountability report state mismatch for role ${role.title}: ${item.currentState} !== ${role.status}`);
  }
  if (lane && item.currentState !== lane.state) {
    throw new Error(`daily role accountability report state mismatch for lane ${lane.id}: ${item.currentState} !== ${lane.state}`);
  }
  if (!item.accountabilityAction.trim()) {
    throw new Error(`daily role accountability report action is empty: ${item.role}`);
  }
  const evidencePaths = parseInlineCodeValues(item.evidence);
  if (evidencePaths.length === 0) {
    throw new Error(`daily role accountability report evidence has no path: ${item.role}`);
  }
  evidencePaths.forEach((evidencePath) => {
    if (!fs.existsSync(path.join(root, evidencePath))) {
      throw new Error(`daily role accountability report evidence path missing: ${item.role} -> ${evidencePath}`);
    }
    if (
      evidencePath.startsWith('docs/orchestration/') &&
      evidencePath.endsWith('.md') &&
      !trackedCardMatches.includes(evidencePath)
    ) {
      throw new Error(`daily role accountability report evidence markdown is not tracked: ${item.role} -> ${evidencePath}`);
    }
  });
});

const lines = [
  `${status.identity}`,
  `loop state: ${status.loopState}`,
  `dispatch state: ${status.dispatchState}`,
  '',
  `target: ${status.target}`,
  '',
  'roles:'
];

status.roles.forEach((role) => {
  lines.push(`- ${role.title} [${role.status}] -> ${role.responsibility}`);
});

lines.push('', 'daily role accountability:');
roleAccountabilityRows.forEach((item) => {
  lines.push(`- ${item.role} [${item.currentState}]`);
  lines.push(`  evidence: ${item.evidence}`);
  lines.push(`  action: ${item.accountabilityAction}`);
});

lines.push('', 'lanes:');
status.lanes.forEach((lane) => {
  lines.push(`- ${lane.title} [${lane.state}] ${lane.role}`);
  lines.push(`  next: ${lane.nextAction}`);
});

if (todayPlan) {
  lines.push('', 'today plan:');
  lines.push(`- date: ${todayPlan.date}`);
  lines.push(`- session: ${todayPlan.session}`);
  lines.push(`- selected route: ${todayPlan.selectedRoute}`);
  if (todayPlan.progress) {
    lines.push(`- progress: ${todayPlan.progress}`);
  }
}

if (p0Cards.length > 0) {
  lines.push('', 'p0 cards:');
  p0Cards.forEach((card) => {
    lines.push(`- ${card.id} [${card.status}] task=${card.task}`);
    if (card.progress) {
      lines.push(`  progress=${card.progress}`);
    }
  });
}

lines.push('', 'active lane control:');
lines.push(`- active lanes: ${activeLaneIds.join(', ')}`);
lines.push(`- ${expectedActiveLaneLine}`);

lines.push('', 'daily supervision closeout:');
dailySupervisionCloseout.forEach(([label, items]) => {
  lines.push(`- ${label}:`);
  items.forEach((item) => {
    lines.push(`  - ${item}`);
  });
});

lines.push('', 'daily decision queue:');
decisionQueueRows.forEach((item) => {
  lines.push(`- ${item.queueItem} [${item.currentOwner}]`);
  lines.push(`  decision: ${item.requiredDecisionOrCondition}`);
  lines.push(`  first action: ${item.allowedFirstActionAfterDecision}`);
  lines.push(`  blocked until: ${item.mustRemainBlockedUntil}`);
});

lines.push('', 'daily decision coverage:');
decisionCoverageRows.forEach((item) => {
  lines.push(`- ${item.openStatusLane} -> ${item.queueCoverage}`);
});

lines.push('', 'daily supervision closeout coverage:');
sessionCloseoutCoverageRows.forEach((item) => {
  lines.push(`- ${item.queueItem} -> ${item.requiredCloseoutEvidence}`);
});

lines.push('', 'connectors:');
connectorPolicy.connectors.forEach((connector) => {
  const command = connector.command || 'pending';
  const resolved = connector.command ? resolveCommand(connector.command) : null;
  const commandState = connector.command ? (resolved ? 'found' : 'missing') : 'pending';
  lines.push(`- ${connector.label} [${connector.status}/${connector.approvalStatus}] command=${command} commandState=${commandState} cwd=${connector.cwdPolicy} confirm=${connector.confirmation} enabled=${connector.enabledByDefault}`);
  if (connector.approvalEvidence) {
    lines.push(`  approval: ${connector.approvalEvidence}`);
  }
});

lines.push('', 'connector defaults:');
lines.push(`- cwd=${connectorPolicy.defaults.cwdPolicy} timeout=${connectorPolicy.defaults.timeoutSeconds}s confirm=${connectorPolicy.defaults.confirmation}`);
lines.push(`- env=${connectorPolicy.defaults.envAllowlist.join(', ')}`);
lines.push(`- dangerous=${connectorPolicy.defaults.dangerousCommandPatterns.join(' | ')}`);

lines.push('', 'blocker:');
lines.push(`- ${status.blocker}`);

lines.push('', 'tracked cards:');
trackedCardMatches.forEach((relativePath) => {
  lines.push(`- ${relativePath}`);
});

console.log(lines.join('\n'));

function resolveCommand(command) {
  const result = spawnSync('where.exe', [command], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true
  });
  return result.status === 0;
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
      currentOwner,
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

function parseRoleAccountabilityRows(content) {
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
      role,
      currentState,
      evidence,
      accountabilityAction
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

function stripInlineCode(value) {
  return value.replace(/`/g, '');
}

function parseInlineCodeValues(value) {
  return [...value.matchAll(/`([^`]+)`/g)].map((match) => match[1].trim()).filter(Boolean);
}

function requireUnique(label, values) {
  const seen = new Set();
  values.forEach((value) => {
    if (!value) {
      return;
    }
    if (seen.has(value)) {
      throw new Error(`${label} must be unique in report: ${value}`);
    }
    seen.add(value);
  });
}
