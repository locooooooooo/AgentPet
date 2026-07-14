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
  /rawCommand/,
  /commandLine/,
  /input\.(?:command|args|env|cwd|executable)/,
  /(?:command|args|env|cwd|executable):\s*input\./
];

for (const pattern of forbiddenPatterns) {
  if (pattern.test(source)) {
    errors.push(`preload exposes or references forbidden connector process data: ${pattern}`);
  }
}

const requiredApi = [
  'evaluateConnectorGate',
  'requestConnectorAuthorization',
  'cancelConnectorAuthorization',
  'runConnector',
  'stopConnector',
  'getConnectorRuntimeSnapshot',
  'getConnectorSessionAudit',
  'onConnectorRuntimeSnapshotChanged'
];

for (const apiName of requiredApi) {
  if (!source.includes(apiName)) {
    errors.push(`preload must expose ${apiName}`);
  }
}

const requiredChannels = [
  'connectors:evaluate-gate',
  'connectors:request-authorization',
  'connectors:cancel-authorization',
  'connectors:run',
  'connectors:stop',
  'connectors:get-runtime-snapshot',
  'connectors:get-session-audit',
  'connectors:runtime-snapshot-changed'
];

for (const channel of requiredChannels) {
  if (!source.includes(`'${channel}'`)) {
    errors.push(`preload is missing connector channel: ${channel}`);
  }
}

const runBody = source.match(/runConnector:[\s\S]*?stopConnector:/)?.[0] ?? '';
for (const field of ['connectorId', 'agentId', 'taskName', 'prompt', 'authorizationGrant']) {
  if (!runBody.includes(`${field}: input.${field}`)) {
    errors.push(`runConnector must copy the allowed ${field} field explicitly`);
  }
}

for (const forbiddenField of ['requestedBy', 'confirmationAccepted']) {
  if (runBody.includes(`${forbiddenField}: input.${forbiddenField}`)) {
    errors.push(`runConnector must not let renderer self-assert ${forbiddenField}`);
  }
}

for (const field of ['maxRetries', 'backoffMs', 'budgetMs']) {
  if (!runBody.includes(`${field}: input.retry.${field}`)) {
    errors.push(`runConnector must copy the allowed retry.${field} field explicitly`);
  }
}

if (/retry:\s*input\.retry(?:\s*[,}])/.test(runBody)) {
  errors.push('runConnector must not pass the nested retry object through to IPC');
}

if (/ipcRenderer\.invoke\([^,]+,\s*input\s*\)/.test(runBody)) {
  errors.push('runConnector must not pass the renderer object through to IPC');
}

const authorizationBody = source.match(/requestConnectorAuthorization:[\s\S]*?cancelConnectorAuthorization:/)?.[0] ?? '';
for (const field of ['connectorId', 'agentId', 'taskName', 'prompt']) {
  if (!authorizationBody.includes(`${field}: input.${field}`)) {
    errors.push(`requestConnectorAuthorization must copy the allowed ${field} field explicitly`);
  }
}
for (const forbiddenField of ['requestedBy', 'confirmationAccepted', 'authorizationGrant']) {
  if (authorizationBody.includes(`${forbiddenField}: input.${forbiddenField}`)) {
    errors.push(`requestConnectorAuthorization must not accept ${forbiddenField} from renderer input`);
  }
}
if (/ipcRenderer\.invoke\([^,]+,\s*input\s*\)/.test(authorizationBody)) {
  errors.push('requestConnectorAuthorization must not pass the renderer object through to IPC');
}

if (!/cancelConnectorAuthorization:[\s\S]*?\{\s*grantId:\s*input\.grantId\s*\}/.test(source)) {
  errors.push('cancelConnectorAuthorization must forward only the opaque grantId');
}

if (!/stopConnector:[\s\S]*?\{\s*taskId:\s*input\.taskId\s*\}/.test(source)) {
  errors.push('stopConnector must forward only taskId');
}

if (!/getConnectorSessionAudit:[\s\S]*?\{\s*sessionId\s*\}/.test(source)) {
  errors.push('getConnectorSessionAudit must forward only sessionId');
}

if (errors.length > 0) {
  console.error('preload connector API check failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('preload connector API check passed.');
console.log(`exposed connector API: ${requiredApi.join(', ')}`);
console.log('raw executable/args/env/cwd passthrough: absent');

await import('./check-connector-runtime.mjs');
