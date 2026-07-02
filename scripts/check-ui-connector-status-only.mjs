import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const workspacePath = path.join(root, 'src/components/NiuMaWorkspace.tsx');
const source = fs.readFileSync(workspacePath, 'utf8');
const errors = [];

const forbiddenConnectorApiPatterns = [
  /createConnector/i,
  /runConnector/i,
  /startConnector/i,
  /executeConnector/i,
  /spawnConnector/i,
  /connectors:(?:run|start|execute|spawn|create-task)/,
  /rawCommand/,
  /commandLine/
];

for (const pattern of forbiddenConnectorApiPatterns) {
  if (pattern.test(source)) {
    errors.push(`UI references forbidden connector execution surface: ${pattern}`);
  }
}

const forbiddenConnectorPassthrough = [
  /connector\.command/,
  /connector\.args/,
  /connector\.cwdPolicy/,
  /connector\.envAllowlist/,
  /confirmationAccepted:\s*true/,
  /requestedBy:\s*['"]default-action['"]/,
  /requestedBy:\s*['"]explicit-user-action['"]/
];

for (const pattern of forbiddenConnectorPassthrough) {
  if (pattern.test(source)) {
    errors.push(`UI passes or treats connector execution data as actionable: ${pattern}`);
  }
}

if (!source.includes('evaluateConnectorGate')) {
  errors.push('UI must use evaluateConnectorGate for status-only connector gate display');
}

if (!source.includes('blockedReasons')) {
  errors.push('UI must display blockedReasons');
}

if (!source.includes('status-only') || !source.includes('not executable')) {
  errors.push('UI must mark connector cards as status-only or not executable');
}

if (errors.length > 0) {
  console.error('UI connector status-only check failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('UI connector status-only check passed.');
console.log('connector gate display: evaluate-only');
console.log('raw connector execution surface: absent');
console.log('command/args/cwd/env passthrough: absent');
