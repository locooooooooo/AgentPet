import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundled = await build({
  entryPoints: ['src/lib/agentInstallPlan.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false,
  logLevel: 'silent'
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`;
const {
  KIMI_EXISTING_INSTALL_PLAN,
  buildInstallConsentPreview,
  evaluateInstallCancellation,
  evaluateJournalRecovery,
  isInstallConsentCurrent,
  reviewAgentInstallPlan
} = await import(moduleUrl);

const clonePlan = () => structuredClone(KIMI_EXISTING_INSTALL_PLAN);
const issueCodes = (review) => review.issues.map((issue) => issue.code);

const kimiDraft = reviewAgentInstallPlan(clonePlan(), 'Kimi');
assert.equal(kimiDraft.status, 'draft');
assert.equal(kimiDraft.executionEnabled, false);
assert.equal(kimiDraft.document?.agentId, 'kimi');
assert.deepEqual(kimiDraft.summary?.publishers, ['unknown']);
assert.deepEqual(kimiDraft.summary?.artifactDigests, []);
assert.equal(kimiDraft.summary?.elevationRequired, false);
assert.equal(kimiDraft.summary?.credentialAccess.required, false);
assert.deepEqual(kimiDraft.summary?.journal, ['atomic-write', 'hash-chain', 'last-known-good', 'secrets-redacted']);
assert(issueCodes(kimiDraft).includes('document-digest-unverified'));
assert(issueCodes(kimiDraft).includes('publisher-unverified'));

const reviewOnly = clonePlan();
reviewOnly.lifecycle = 'accepted';
reviewOnly.integrity.documentSha256 = 'a'.repeat(64);
const validReviewOnly = reviewAgentInstallPlan(reviewOnly, 'Kimi');
assert.equal(validReviewOnly.status, 'draft', 'existing-install without publisher/artifact trust must remain draft');
assert.equal(validReviewOnly.executionEnabled, false);

const trustedReviewOnly = clonePlan();
trustedReviewOnly.lifecycle = 'accepted';
trustedReviewOnly.sourceArtifacts = [{
  artifactId: 'kimi-identity-lock',
  sourceRef: 'kimi.official.identity',
  uri: 'https://download.example.invalid/kimi-identity.json',
  publisherId: 'kimi',
  version: '1.0.0',
  sizeBytes: 1024,
  sha256: 'b'.repeat(64),
  signature: { publisherId: 'kimi', artifactSha256: 'b'.repeat(64), status: 'verified' },
  license: { identifier: 'proprietary', url: 'https://example.invalid/license' }
}];
trustedReviewOnly.steps.splice(1, 0, {
  stepId: 'verify-publisher',
  kind: 'verify-publisher-signature',
  dependsOn: ['select-primary'],
  inputRefs: ['kimi-identity-lock'],
  effects: [{ kind: 'verify-artifact', scopeRef: 'kimi-identity-lock' }],
  confirmation: 'none',
  cancellability: 'cooperative',
  timeoutSeconds: 15,
  idempotency: 'safe-repeat',
  compensationStepIds: [],
  successEvidence: [{ subject: 'artifact.publisher', assessment: 'verified' }],
  auditEventKinds: ['step-started', 'step-succeeded', 'step-failed']
});
trustedReviewOnly.steps[2].dependsOn = ['verify-publisher'];
trustedReviewOnly.integrity.documentSha256 = 'a'.repeat(64);
trustedReviewOnly.integrity.signature = {
  publisherId: 'niuma-hub-r0-contract',
  artifactSha256: 'a'.repeat(64),
  status: 'verified'
};
const trustedReview = reviewAgentInstallPlan(trustedReviewOnly, 'Kimi');
assert.equal(trustedReview.status, 'valid-review-only');
assert.equal(trustedReview.executionEnabled, false, 'accepted review data still cannot execute in M1.2');

const unknownField = clonePlan();
unknownField.agentID = unknownField.agentId;
assert.equal(reviewAgentInstallPlan(unknownField).status, 'rejected');
assert(issueCodes(reviewAgentInstallPlan(unknownField)).includes('unknown-field'));

const rawShell = clonePlan();
rawShell.steps[0].kind = 'powershell-script';
rawShell.steps[0].effects = [{ kind: 'download-and-execute-script' }];
const rawShellReview = reviewAgentInstallPlan(rawShell);
assert.equal(rawShellReview.status, 'rejected');
assert(issueCodes(rawShellReview).includes('step-kind-forbidden'));
assert(issueCodes(rawShellReview).includes('raw-command-forbidden'));

const httpSource = clonePlan();
httpSource.method = 'official-installer';
httpSource.sourceArtifacts = [{
  artifactId: 'kimi-installer',
  sourceRef: 'kimi.official.windows',
  uri: 'http://mirror.invalid/kimi.exe',
  publisherId: 'kimi',
  version: '1.0.0',
  sizeBytes: 1024,
  sha256: 'b'.repeat(64),
  signature: null,
  license: { identifier: 'proprietary', url: 'https://example.invalid/license' }
}];
const httpReview = reviewAgentInstallPlan(httpSource);
assert.equal(httpReview.status, 'rejected');
assert(issueCodes(httpReview).includes('insecure-artifact-source'));

const signatureConflict = structuredClone(httpSource);
signatureConflict.sourceArtifacts[0].uri = 'https://example.invalid/kimi.exe';
signatureConflict.sourceArtifacts[0].signature = {
  publisherId: 'other-publisher',
  artifactSha256: 'c'.repeat(64),
  status: 'verified'
};
const signatureReview = reviewAgentInstallPlan(signatureConflict);
assert.equal(signatureReview.status, 'rejected');
assert(issueCodes(signatureReview).includes('signature-artifact-conflict'));

const implicitElevation = clonePlan();
implicitElevation.permissions.elevation = {
  required: true,
  reason: 'machine-wide install',
  promptStepId: 'missing-elevation-consent'
};
const elevationReview = reviewAgentInstallPlan(implicitElevation);
assert.equal(elevationReview.status, 'rejected');
assert(issueCodes(elevationReview).includes('implicit-elevation'));

const undeclaredEffect = clonePlan();
undeclaredEffect.steps[1].effects.push({ kind: 'change-service', scopeRef: 'KimiService', reversible: true });
const undeclaredReview = reviewAgentInstallPlan(undeclaredEffect);
assert.equal(undeclaredReview.status, 'rejected');
assert(issueCodes(undeclaredReview).includes('undeclared-effect'));

for (const forbiddenEffect of ['login-agent', 'start-agent-task', 'modify-connector-gate']) {
  const boundaryEscape = clonePlan();
  boundaryEscape.steps[1].effects.push({ kind: forbiddenEffect });
  const boundaryReview = reviewAgentInstallPlan(boundaryEscape);
  assert.equal(boundaryReview.status, 'rejected');
  assert(issueCodes(boundaryReview).includes('raw-command-forbidden'));
}

const unconfirmedPathMutation = clonePlan();
unconfirmedPathMutation.permissions.pathMutation = {
  required: true,
  scope: 'user-path',
  previousValueCapture: true
};
unconfirmedPathMutation.steps[1].effects.push({ kind: 'mutate-path', scopeRef: 'user-path', reversible: true });
const pathMutationReview = reviewAgentInstallPlan(unconfirmedPathMutation);
assert.equal(pathMutationReview.status, 'rejected');
assert(issueCodes(pathMutationReview).includes('separate-consent-missing'));

const unrecoverableWrite = clonePlan();
unrecoverableWrite.permissions.filesystemWrites[0].locationKind = 'exact-directory';
unrecoverableWrite.permissions.filesystemWrites[0].path = 'C:\\Program Files\\Kimi';
const recoveryReview = reviewAgentInstallPlan(unrecoverableWrite);
assert.equal(recoveryReview.status, 'rejected');
assert(issueCodes(recoveryReview).includes('recovery-step-missing'));

const journalFailure = clonePlan();
journalFailure.journalPolicy.hashChain = false;
const journalReview = reviewAgentInstallPlan(journalFailure);
assert.equal(journalReview.status, 'rejected');
assert(issueCodes(journalReview).includes('unsafe-journal-policy'));

const credentialPlan = clonePlan();
credentialPlan.permissions.credentialAccess = { required: true, kinds: ['token'] };
assert(issueCodes(reviewAgentInstallPlan(credentialPlan)).includes('credential-access-forbidden'));

const previousConsent = buildInstallConsentPreview(clonePlan());
const driftedPlan = clonePlan();
driftedPlan.planVersion = '0.1.1';
assert.equal(isInstallConsentCurrent(previousConsent, clonePlan()), true);
assert.equal(isInstallConsentCurrent(previousConsent, driftedPlan), false, 'plan digest/version drift must require fresh consent');

const cancelledReady = evaluateInstallCancellation('ready');
assert.deepEqual(cancelledReady, {
  nextState: 'cancelled',
  allowNewNormalStep: false,
  waitForSafePoint: false,
  allowAuthorizedCompensation: false
});
const cancellingNonInterruptible = evaluateInstallCancellation('running', { cancellability: 'non-interruptible' });
assert.equal(cancellingNonInterruptible.nextState, 'cancelling');
assert.equal(cancellingNonInterruptible.allowNewNormalStep, false);
assert.equal(cancellingNonInterruptible.waitForSafePoint, true);
assert.equal(cancellingNonInterruptible.allowAuthorizedCompensation, true);

assert.equal(evaluateJournalRecovery(false, true), 'recovery-failed');
assert.equal(evaluateJournalRecovery(true, false), 'recovery-failed');
assert.equal(evaluateJournalRecovery(true, true), 'recovering');

console.log('agent InstallPlan review check passed.');
console.log('strict schema, HTTPS/artifact trust, declared effects, consent drift, cancellation, recovery and Journal fail-closed paths verified.');
