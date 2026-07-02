import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const preloadPath = path.join(root, 'electron/preload.ts');
const source = fs.readFileSync(preloadPath, 'utf8');
const errors = [];

const forbiddenPatterns = [
  /node:child_process/,
  /\bspawn(?:Sync)?\b/,
  /\bshell\b/i,
  /connectors:(?:run|start|execute|spawn|create-task)/,
  /connector(?:Run|Start|Execute|Spawn)/,
  /runConnector|startConnector|executeConnector|spawnConnector/,
  /rawCommand|commandLine/
];

for (const pattern of forbiddenPatterns) {
  if (pattern.test(source)) {
    errors.push(`preload exposes or references forbidden connector execution surface: ${pattern}`);
  }
}

if (!source.includes('evaluateConnectorGate')) {
  errors.push('preload must expose evaluateConnectorGate');
}

if (!source.includes("'connectors:evaluate-gate'")) {
  errors.push('preload must call only connectors:evaluate-gate for connector API');
}

if (/evaluateConnectorGate\s*:\s*\([^)]*command/.test(source)) {
  errors.push('evaluateConnectorGate must not accept a command parameter');
}

if (!/connectorId:\s*input\.connectorId/.test(source)) {
  errors.push('evaluateConnectorGate must forward connectorId instead of raw command');
}

if (errors.length > 0) {
  console.error('preload connector API check failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('preload connector API check passed.');
console.log('exposed connector API: evaluateConnectorGate');
console.log('raw connector execution surface: absent');
