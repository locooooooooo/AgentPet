import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const statusPath = path.join(root, 'docs/orchestration/status.json');
const connectorsPath = path.join(root, 'docs/orchestration/connectors.json');
const indexPath = path.join(root, 'docs/orchestration/index.md');

const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
const connectorPolicy = JSON.parse(fs.readFileSync(connectorsPath, 'utf8'));
const index = fs.readFileSync(indexPath, 'utf8');
const trackedCardMatches = [...new Set(
  [...index.matchAll(/`(docs\/orchestration\/[^`]+\.md)`/g)].map((match) => match[1])
)];

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

lines.push('', 'lanes:');
status.lanes.forEach((lane) => {
  lines.push(`- ${lane.title} [${lane.state}] ${lane.role}`);
  lines.push(`  next: ${lane.nextAction}`);
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
