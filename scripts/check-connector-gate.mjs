import { transform } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const gatePath = path.join(root, 'src/lib/connectorGate.ts');
const policyPath = path.join(root, 'docs/orchestration/connectors.json');
const gateSource = fs.readFileSync(gatePath, 'utf8');
const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

if (gateSource.includes('node:child_process') || /\bspawn(?:Sync)?\s*\(/.test(gateSource)) {
  throw new Error('connector gate must not import child_process or call spawn');
}

const transformed = await transform(gateSource, {
  loader: 'ts',
  format: 'esm',
  target: 'es2022'
});
const gate = await import(`data:text/javascript;base64,${Buffer.from(transformed.code).toString('base64')}`);

let discoveryAttempts = 0;
const results = policy.connectors.map((connector) => {
  const evaluation = gate.evaluateConnectorPolicyGate(
    policy,
    {
      connectorId: connector.id,
      requestedBy: 'default-action',
      confirmationAccepted: false
    },
    () => {
      discoveryAttempts += 1;
      return true;
    }
  );
  return [connector.id, evaluation];
});

for (const [connectorId, evaluation] of results) {
  if (evaluation.result.executable) {
    throw new Error(`${connectorId} unexpectedly became executable`);
  }
  if (evaluation.discoveryAttempted) {
    throw new Error(`${connectorId} attempted discovery despite current blocked state`);
  }
}

if (discoveryAttempts !== 0) {
  throw new Error(`expected zero discovery attempts, got ${discoveryAttempts}`);
}

const reasons = Object.fromEntries(results.map(([connectorId, evaluation]) => [
  connectorId,
  evaluation.result.blockedReasons
]));
assertReasons('codex', reasons.codex, ['status-not-ready', 'approval-not-accepted', 'disabled-by-default']);
assertReasons('trae', reasons.trae, ['status-not-ready', 'approval-not-accepted', 'disabled-by-default']);
assertReasons('qoder', reasons.qoder, ['status-not-ready', 'approval-not-accepted', 'disabled-by-default', 'command-missing']);

const codex = policy.connectors.find((connector) => connector.id === 'codex');
const auditEvidenceOnly = {
  ...codex,
  acceptedBy: 'PM',
  acceptedAt: '2026-07-01T00:00:00+08:00',
  approvalEvidence: 'Human-readable acceptance-looking text is not a machine gate.'
};
const auditEvaluation = gate.evaluateConnectorPolicyGate(
  { ...policy, connectors: [auditEvidenceOnly] },
  {
    connectorId: 'codex',
    requestedBy: 'default-action',
    confirmationAccepted: true
  },
  () => {
    discoveryAttempts += 1;
    return true;
  }
);

if (auditEvaluation.result.executable) {
  throw new Error('audit evidence fields unexpectedly made Codex executable');
}
assertReasons('codex audit evidence', auditEvaluation.result.blockedReasons, [
  'status-not-ready',
  'approval-not-accepted',
  'disabled-by-default'
]);

console.log('connector gate check passed.');
console.log('blocked connectors: codex, trae, qoder');
console.log('discovery attempts before static unblock: 0');
console.log('audit fields do not grant executable permission.');

function assertReasons(name, actual, expected) {
  for (const reason of expected) {
    if (!actual.includes(reason)) {
      throw new Error(`${name} missing blocked reason: ${reason}`);
    }
  }
}
