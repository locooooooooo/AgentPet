import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'docs/orchestration/connectors.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const errors = [];
const warnings = [];

function resolveCommand(command) {
  if (!command.trim()) {
    return null;
  }

  const result = spawnSync('where.exe', [command], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true
  });

  if (result.status !== 0) {
    return null;
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)[0] ?? null;
}

console.log('[connector-preflight]');
console.log(`version: ${config.version}`);
console.log(`defaults: cwd=${config.defaults.cwdPolicy} timeout=${config.defaults.timeoutSeconds}s confirmation=${config.defaults.confirmation}`);

for (const connector of config.connectors) {
  const resolvedPath = resolveCommand(connector.command);
  const commandState = connector.command ? (resolvedPath ? `found: ${resolvedPath}` : 'missing from PATH') : 'pending';
  console.log(`- ${connector.id}: status=${connector.status} approval=${connector.approvalStatus} enabled=${connector.enabledByDefault} command=${connector.command || 'pending'} -> ${commandState}`);

  if (connector.enabledByDefault && connector.status !== 'ready') {
    errors.push(`${connector.id}: enabledByDefault requires ready status`);
  }

  if (connector.enabledByDefault && connector.approvalStatus !== 'accepted') {
    errors.push(`${connector.id}: enabledByDefault requires accepted approvalStatus`);
  }

  if (connector.status === 'ready' && !resolvedPath) {
    errors.push(`${connector.id}: ready connector command is not resolvable`);
  }

  if (connector.status === 'draft' && !resolvedPath) {
    warnings.push(`${connector.id}: draft command is not resolvable yet`);
  }

  if (connector.status === 'placeholder' && connector.command.trim()) {
    errors.push(`${connector.id}: placeholder connector must keep command empty`);
  }
}

if (warnings.length > 0) {
  console.log('warnings:');
  warnings.forEach((warning) => console.log(`- ${warning}`));
}

if (errors.length > 0) {
  console.error('connector preflight failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('connector preflight passed.');
