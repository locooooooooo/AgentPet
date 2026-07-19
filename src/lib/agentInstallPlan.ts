export type InstallPlanReviewStatus = 'unavailable' | 'draft' | 'valid-review-only' | 'rejected';
export type InstallPlanLifecycle = 'draft' | 'distributed' | 'accepted' | 'revoked';
export type InstallPlanMethod = 'package-manager' | 'official-installer' | 'official-guidance' | 'existing-install';
export type InstallStepConfirmation = 'none' | 'plan-consent' | 'separate-elevation' | 'separate-destructive';
export type InstallStepCancellability = 'before-start' | 'cooperative' | 'non-interruptible';
export type InstallStepIdempotency = 'safe-repeat' | 'check-before-repeat' | 'never-repeat';
export type InstallRunState =
  | 'created'
  | 'validating'
  | 'awaiting-plan-consent'
  | 'ready'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelling'
  | 'cancelled'
  | 'recovering'
  | 'recovered'
  | 'recovery-failed';

export interface InstallArtifactSignature {
  publisherId: string;
  artifactSha256: string;
  status: 'verified' | 'unverified';
}

export interface InstallArtifact {
  artifactId: string;
  sourceRef: string;
  uri: string;
  publisherId: string;
  version: string;
  sizeBytes: number;
  sha256: string;
  signature: InstallArtifactSignature | null;
  license: {
    identifier: string;
    url: string;
  };
}

export interface InstallPlanPrecondition {
  preconditionId: string;
  kind: 'platform-match' | 'disk-space' | 'source-reachable' | 'policy-allowed' | 'existing-path-selected';
  parameters?: Record<string, unknown>;
  onFailure: 'stop-rejected' | 'stop-unknown' | 'request-user-decision';
}

export interface InstallEvidenceRequirement {
  subject: string;
  assessment: 'verified';
  evidenceKinds?: string[];
}

export interface InstallPathScope {
  scopeId: string;
  locationKind: 'exact-file' | 'exact-directory' | 'user-selected' | 'hub-data';
  path: string | null;
  operations: string[];
  purpose: string;
}

export interface InstallServiceEffect {
  serviceName: string;
  operation: 'install' | 'start' | 'stop' | 'remove';
  purpose: string;
  reversible: boolean;
  confirmation: InstallStepConfirmation;
}

export interface InstallProcessEffect {
  executableId: string;
  argsTemplate: string[];
  purpose: string;
  requiresElevation: boolean;
  confirmation: InstallStepConfirmation;
}

export interface InstallPermissionManifest {
  network: { required: boolean; hosts: string[]; purposes: string[] };
  elevation: { required: boolean; reason: string; promptStepId: string | null };
  filesystemReads: InstallPathScope[];
  filesystemWrites: InstallPathScope[];
  pathMutation: { required: boolean; scope: string | null; previousValueCapture: boolean };
  shellProfileMutation: { required: boolean; files: string[]; previousValueCapture: boolean };
  serviceChanges: InstallServiceEffect[];
  processLaunches: InstallProcessEffect[];
  credentialAccess: { required: boolean; kinds: string[] };
}

export interface InstallStepEffect {
  kind: string;
  scopeRef?: string;
  reversible?: boolean;
}

export interface InstallStep {
  stepId: string;
  kind:
    | 'collect-user-selection'
    | 'inspect-existing-install'
    | 'resolve-package-version'
    | 'download-official-artifact'
    | 'verify-artifact-hash'
    | 'verify-publisher-signature'
    | 'request-plan-consent'
    | 'request-elevation-consent'
    | 'invoke-package-manager'
    | 'invoke-official-installer'
    | 'open-official-guidance'
    | 'verify-primary-executable'
    | 'verify-installed-version'
    | 'record-installation-evidence'
    | 'restore-previous-state'
    | 'remove-partial-artifact';
  dependsOn: string[];
  inputRefs: string[];
  effects: InstallStepEffect[];
  confirmation: InstallStepConfirmation;
  cancellability: InstallStepCancellability;
  timeoutSeconds: number;
  idempotency: InstallStepIdempotency;
  compensationStepIds: string[];
  successEvidence: InstallEvidenceRequirement[];
  auditEventKinds: string[];
}

export interface AgentInstallPlan {
  schema: 'niuma.install-plan';
  schemaVersion: '0.1.0';
  lifecycle: InstallPlanLifecycle;
  planId: string;
  planVersion: string;
  agentId: string;
  manifestVersionRange: string;
  method: InstallPlanMethod;
  platform: { os: 'windows'; architecture: 'x64' | 'arm64' };
  sourceArtifacts: InstallArtifact[];
  preconditions: InstallPlanPrecondition[];
  permissions: InstallPermissionManifest;
  steps: InstallStep[];
  successEvidence: InstallEvidenceRequirement[];
  failurePolicy: {
    defaultAction: 'stop';
    recoverOnPartialEffect: boolean;
    manualDecisionOnUnknown: boolean;
  };
  cancellationPolicy: {
    startNoNewNormalStep: boolean;
    runAuthorizedCompensation: boolean;
    preserveJournal: boolean;
  };
  journalPolicy: {
    atomicWrite: boolean;
    hashChain: boolean;
    lastKnownGood: boolean;
    redactSecrets: boolean;
  };
  provenance: {
    authoredBy: string;
    createdAt: string;
    sourceEvidenceRefs: string[];
  };
  integrity: {
    algorithm: 'sha256';
    documentSha256: string | null;
    signature: InstallArtifactSignature | null;
  };
}

export interface InstallPlanValidationIssue {
  code: string;
  path: string;
  message: string;
  severity: 'error' | 'pending';
}

export interface InstallConsentPreview {
  binding: string;
  planId: string;
  planVersion: string;
  manifestVersionRange: string;
  artifactDigests: string[];
  effectsFingerprint: string;
}

export interface InstallPlanSummary {
  source: string;
  publishers: string[];
  artifactDigests: string[];
  artifactBytes: number;
  networkHosts: string[];
  networkPurposes: string[];
  elevationRequired: boolean;
  elevationReason: string;
  filesystemReads: InstallPathScope[];
  filesystemWrites: InstallPathScope[];
  pathMutation: AgentInstallPlan['permissions']['pathMutation'];
  shellProfileMutation: AgentInstallPlan['permissions']['shellProfileMutation'];
  serviceChanges: InstallServiceEffect[];
  processLaunches: InstallProcessEffect[];
  credentialAccess: AgentInstallPlan['permissions']['credentialAccess'];
  totalTimeoutSeconds: number;
  cancellability: InstallStepCancellability[];
  idempotency: InstallStepIdempotency[];
  recovery: string;
  journal: string[];
}

export interface InstallPlanReview {
  agentId: string;
  displayName: string;
  planId: string | null;
  status: InstallPlanReviewStatus;
  executionEnabled: false;
  document: AgentInstallPlan | null;
  summary: InstallPlanSummary | null;
  consent: InstallConsentPreview | null;
  issues: InstallPlanValidationIssue[];
}

const ALLOWED_ROOT_KEYS = [
  'schema', 'schemaVersion', 'lifecycle', 'planId', 'planVersion', 'agentId', 'manifestVersionRange',
  'method', 'platform', 'sourceArtifacts', 'preconditions', 'permissions', 'steps', 'successEvidence',
  'failurePolicy', 'cancellationPolicy', 'journalPolicy', 'provenance', 'integrity'
] as const;
const ALLOWED_STEP_KINDS = new Set<InstallStep['kind']>([
  'collect-user-selection', 'inspect-existing-install', 'resolve-package-version', 'download-official-artifact',
  'verify-artifact-hash', 'verify-publisher-signature', 'request-plan-consent', 'request-elevation-consent',
  'invoke-package-manager', 'invoke-official-installer', 'open-official-guidance', 'verify-primary-executable',
  'verify-installed-version', 'record-installation-evidence', 'restore-previous-state', 'remove-partial-artifact'
]);
const FORBIDDEN_EFFECT_KINDS = new Set(['shell', 'powershell-script', 'cmd-string', 'download-and-execute-script', 'login-agent', 'start-agent-task', 'modify-connector-gate']);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
const SHELL_META_PATTERN = /[;&|`$<>\r\n]/;

export const KIMI_EXISTING_INSTALL_PLAN: AgentInstallPlan = {
  schema: 'niuma.install-plan',
  schemaVersion: '0.1.0',
  lifecycle: 'draft',
  planId: 'install:kimi:windows:existing',
  planVersion: '0.1.0',
  agentId: 'kimi',
  manifestVersionRange: '>=0.1.0 <0.2.0',
  method: 'existing-install',
  platform: { os: 'windows', architecture: 'x64' },
  sourceArtifacts: [],
  preconditions: [{
    preconditionId: 'windows-x64',
    kind: 'platform-match',
    onFailure: 'stop-unknown'
  }],
  permissions: {
    network: { required: false, hosts: [], purposes: [] },
    elevation: { required: false, reason: '', promptStepId: null },
    filesystemReads: [{
      scopeId: 'selected-primary',
      locationKind: 'user-selected',
      path: null,
      operations: ['read-metadata'],
      purpose: 'inspect-existing-install'
    }],
    filesystemWrites: [{
      scopeId: 'hub-agent-evidence',
      locationKind: 'hub-data',
      path: 'agent-data/evidence',
      operations: ['create', 'replace'],
      purpose: 'record-evidence'
    }],
    pathMutation: { required: false, scope: null, previousValueCapture: false },
    shellProfileMutation: { required: false, files: [], previousValueCapture: false },
    serviceChanges: [],
    processLaunches: [],
    credentialAccess: { required: false, kinds: [] }
  },
  steps: [
    {
      stepId: 'select-primary',
      kind: 'collect-user-selection',
      dependsOn: [],
      inputRefs: ['kimi.desktop.windows.primary'],
      effects: [{ kind: 'read-user-selected-file', scopeRef: 'selected-primary' }],
      confirmation: 'plan-consent',
      cancellability: 'before-start',
      timeoutSeconds: 300,
      idempotency: 'safe-repeat',
      compensationStepIds: [],
      successEvidence: [{ subject: 'candidate.primary-selected', assessment: 'verified' }],
      auditEventKinds: ['step-started', 'step-succeeded', 'step-failed']
    },
    {
      stepId: 'verify-primary',
      kind: 'verify-primary-executable',
      dependsOn: ['select-primary'],
      inputRefs: ['kimi.desktop.windows.primary'],
      effects: [{ kind: 'read-file-metadata', scopeRef: 'selected-primary' }],
      confirmation: 'none',
      cancellability: 'cooperative',
      timeoutSeconds: 30,
      idempotency: 'safe-repeat',
      compensationStepIds: [],
      successEvidence: [{ subject: 'candidate.primary-identity', assessment: 'verified' }],
      auditEventKinds: ['step-started', 'step-succeeded', 'step-failed']
    },
    {
      stepId: 'record-installation',
      kind: 'record-installation-evidence',
      dependsOn: ['verify-primary'],
      inputRefs: ['candidate.primary-identity'],
      effects: [{ kind: 'write-hub-evidence', scopeRef: 'hub-agent-evidence', reversible: true }],
      confirmation: 'none',
      cancellability: 'cooperative',
      timeoutSeconds: 10,
      idempotency: 'check-before-repeat',
      compensationStepIds: [],
      successEvidence: [{ subject: 'lifecycle.installed', assessment: 'verified' }],
      auditEventKinds: ['step-started', 'step-succeeded', 'step-failed']
    }
  ],
  successEvidence: [{ subject: 'lifecycle.installed', assessment: 'verified' }],
  failurePolicy: {
    defaultAction: 'stop',
    recoverOnPartialEffect: true,
    manualDecisionOnUnknown: true
  },
  cancellationPolicy: {
    startNoNewNormalStep: true,
    runAuthorizedCompensation: true,
    preserveJournal: true
  },
  journalPolicy: {
    atomicWrite: true,
    hashChain: true,
    lastKnownGood: true,
    redactSecrets: true
  },
  provenance: {
    authoredBy: 'niuma-hub-r0-contract',
    createdAt: '2026-07-18T00:00:00.000Z',
    sourceEvidenceRefs: ['local-observation:kimi:windows:2026-07-18']
  },
  integrity: {
    algorithm: 'sha256',
    documentSha256: null,
    signature: null
  }
};

export const AGENT_INSTALL_PLAN_REVIEWS: readonly InstallPlanReview[] = Object.freeze([
  reviewAgentInstallPlan(KIMI_EXISTING_INSTALL_PLAN, 'Kimi')
]);

export function reviewAgentInstallPlan(input: unknown, displayName?: string): InstallPlanReview {
  const issues: InstallPlanValidationIssue[] = [];
  if (!isRecord(input)) {
    addIssue(issues, 'invalid-document', '$', 'InstallPlan must be an object.');
    return rejectedReview('', displayName ?? 'Unknown', issues);
  }

  expectKeys(input, ALLOWED_ROOT_KEYS, '$', issues);
  expectExact(input.schema, 'niuma.install-plan', '$.schema', 'schema-unsupported', issues);
  expectExact(input.schemaVersion, '0.1.0', '$.schemaVersion', 'schema-version-unsupported', issues);
  expectEnum(input.lifecycle, ['draft', 'distributed', 'accepted', 'revoked'], '$.lifecycle', issues);
  expectString(input.planId, '$.planId', issues);
  expectPattern(input.planVersion, SEMVER_PATTERN, '$.planVersion', 'invalid-plan-version', issues);
  expectPattern(input.agentId, /^[a-z][a-z0-9-]*$/, '$.agentId', 'invalid-agent-id', issues);
  expectString(input.manifestVersionRange, '$.manifestVersionRange', issues);
  expectEnum(input.method, ['package-manager', 'official-installer', 'official-guidance', 'existing-install'], '$.method', issues);
  validatePlatform(input.platform, issues);
  validateArtifacts(input.sourceArtifacts, input.method, issues);
  validatePreconditions(input.preconditions, issues);
  validatePermissions(input.permissions, issues);
  validateSteps(input.steps, input.permissions, input.sourceArtifacts, input.journalPolicy, issues);
  validateMethodSteps(input.method, input.steps, input.sourceArtifacts, issues);
  validateArtifactNetworkScopes(input.method, input.sourceArtifacts, input.permissions, issues);
  validateEvidence(input.successEvidence, '$.successEvidence', issues, true);
  validatePolicies(input, issues);
  validateProvenance(input.provenance, issues);
  validateIntegrity(input.integrity, issues);

  const agentId = typeof input.agentId === 'string' ? input.agentId : '';
  const name = displayName ?? (agentId ? agentId[0].toUpperCase() + agentId.slice(1) : 'Unknown');
  const hasError = issues.some((issue) => issue.severity === 'error');
  if (hasError) {
    return rejectedReview(agentId, name, issues, typeof input.planId === 'string' ? input.planId : null);
  }

  const document = input as unknown as AgentInstallPlan;
  if (document.lifecycle === 'revoked') {
    addIssue(issues, 'plan-revoked', '$.lifecycle', 'Revoked plans cannot pass the review gate.');
    return rejectedReview(agentId, name, issues, document.planId);
  }

  if (document.lifecycle === 'draft') {
    addPending(issues, 'lifecycle-draft', '$.lifecycle', 'Plan lifecycle is still draft.');
  }
  if (!document.integrity.documentSha256) {
    addPending(issues, 'document-digest-unverified', '$.integrity.documentSha256', 'Document digest is not verified.');
  }
  if (document.integrity.signature?.status !== 'verified') {
    addPending(issues, 'document-signature-unverified', '$.integrity.signature', 'Document signature is not verified.');
  }
  if (document.sourceArtifacts.length === 0) {
    addPending(issues, 'publisher-unverified', '$.sourceArtifacts', 'Publisher and artifact digest are not verified for this existing-install plan.');
  } else if (document.sourceArtifacts.some((artifact) => artifact.signature?.status !== 'verified')) {
    addPending(issues, 'artifact-signature-unverified', '$.sourceArtifacts', 'Every locked artifact needs a verified publisher signature.');
  }

  const status: InstallPlanReviewStatus = issues.some((issue) => issue.severity === 'pending')
    ? 'draft'
    : 'valid-review-only';
  return {
    agentId,
    displayName: name,
    planId: document.planId,
    status,
    executionEnabled: false,
    document,
    summary: summarizeInstallPlan(document),
    consent: buildInstallConsentPreview(document),
    issues
  };
}

export function unavailableInstallPlan(agentId: string, displayName: string): InstallPlanReview {
  return {
    agentId,
    displayName,
    planId: null,
    status: 'unavailable',
    executionEnabled: false,
    document: null,
    summary: null,
    consent: null,
    issues: []
  };
}

export function summarizeInstallPlan(plan: AgentInstallPlan): InstallPlanSummary {
  const artifactDigests = plan.sourceArtifacts.map((artifact) => artifact.sha256);
  return {
    source: plan.sourceArtifacts.length > 0
      ? plan.sourceArtifacts.map((artifact) => artifact.sourceRef).join(', ')
      : plan.provenance.sourceEvidenceRefs.join(', ') || 'unknown',
    publishers: plan.sourceArtifacts.length > 0
      ? unique(plan.sourceArtifacts.map((artifact) => artifact.publisherId))
      : ['unknown'],
    artifactDigests,
    artifactBytes: plan.sourceArtifacts.reduce((total, artifact) => total + artifact.sizeBytes, 0),
    networkHosts: [...plan.permissions.network.hosts],
    networkPurposes: [...plan.permissions.network.purposes],
    elevationRequired: plan.permissions.elevation.required,
    elevationReason: plan.permissions.elevation.reason,
    filesystemReads: plan.permissions.filesystemReads.map(clonePathScope),
    filesystemWrites: plan.permissions.filesystemWrites.map(clonePathScope),
    pathMutation: { ...plan.permissions.pathMutation },
    shellProfileMutation: {
      ...plan.permissions.shellProfileMutation,
      files: [...plan.permissions.shellProfileMutation.files]
    },
    serviceChanges: plan.permissions.serviceChanges.map((effect) => ({ ...effect })),
    processLaunches: plan.permissions.processLaunches.map((effect) => ({
      ...effect,
      argsTemplate: [...effect.argsTemplate]
    })),
    credentialAccess: {
      ...plan.permissions.credentialAccess,
      kinds: [...plan.permissions.credentialAccess.kinds]
    },
    totalTimeoutSeconds: plan.steps.reduce((total, step) => total + step.timeoutSeconds, 0),
    cancellability: unique(plan.steps.map((step) => step.cancellability)),
    idempotency: unique(plan.steps.map((step) => step.idempotency)),
    recovery: plan.failurePolicy.recoverOnPartialEffect
      ? 'stop + authorized compensation + manual decision on unknown'
      : 'stop without automatic recovery',
    journal: [
      plan.journalPolicy.atomicWrite ? 'atomic-write' : 'non-atomic',
      plan.journalPolicy.hashChain ? 'hash-chain' : 'no-hash-chain',
      plan.journalPolicy.lastKnownGood ? 'last-known-good' : 'no-last-known-good',
      plan.journalPolicy.redactSecrets ? 'secrets-redacted' : 'secrets-unredacted'
    ]
  };
}

export function buildInstallConsentPreview(plan: AgentInstallPlan): InstallConsentPreview {
  const artifactDigests = plan.sourceArtifacts.map((artifact) => artifact.sha256).sort();
  const effects = plan.steps.map((step) => ({
    stepId: step.stepId,
    effects: step.effects.map((effect) => ({
      kind: effect.kind,
      scopeRef: effect.scopeRef ?? '',
      reversible: effect.reversible ?? null
    }))
  }));
  const effectsFingerprint = `review-fnv1a-${fnv1a(stableSerialize(effects))}`;
  const binding = [
    plan.planId,
    plan.planVersion,
    plan.manifestVersionRange,
    artifactDigests.join(','),
    effectsFingerprint
  ].join('|');
  return {
    binding,
    planId: plan.planId,
    planVersion: plan.planVersion,
    manifestVersionRange: plan.manifestVersionRange,
    artifactDigests,
    effectsFingerprint
  };
}

export function isInstallConsentCurrent(previous: InstallConsentPreview, plan: AgentInstallPlan): boolean {
  return previous.binding === buildInstallConsentPreview(plan).binding;
}

export function evaluateInstallCancellation(state: InstallRunState, currentStep?: Pick<InstallStep, 'cancellability'>): {
  nextState: InstallRunState;
  allowNewNormalStep: false;
  waitForSafePoint: boolean;
  allowAuthorizedCompensation: boolean;
} {
  const beforeRun = ['created', 'validating', 'awaiting-plan-consent', 'ready'].includes(state);
  const waitForSafePoint = state === 'running' && currentStep?.cancellability === 'non-interruptible';
  return {
    nextState: beforeRun ? 'cancelled' : waitForSafePoint ? 'cancelling' : 'cancelling',
    allowNewNormalStep: false,
    waitForSafePoint,
    allowAuthorizedCompensation: !beforeRun
  };
}

export function evaluateJournalRecovery(hashChainValid: boolean, lastKnownGoodAvailable: boolean): InstallRunState {
  return hashChainValid && lastKnownGoodAvailable ? 'recovering' : 'recovery-failed';
}

function validatePlatform(value: unknown, issues: InstallPlanValidationIssue[]) {
  if (!isRecord(value)) {
    addIssue(issues, 'invalid-platform', '$.platform', 'Platform selector must be an object.');
    return;
  }
  expectKeys(value, ['os', 'architecture'], '$.platform', issues);
  expectExact(value.os, 'windows', '$.platform.os', 'platform-unsupported', issues);
  expectEnum(value.architecture, ['x64', 'arm64'], '$.platform.architecture', issues);
}

function validateArtifacts(value: unknown, method: unknown, issues: InstallPlanValidationIssue[]) {
  if (!Array.isArray(value)) {
    addIssue(issues, 'invalid-artifacts', '$.sourceArtifacts', 'sourceArtifacts must be an array.');
    return;
  }
  if (!['official-guidance', 'existing-install'].includes(String(method)) && value.length === 0) {
    addIssue(issues, 'artifact-required', '$.sourceArtifacts', 'This install method requires a locked artifact.');
  }
  const ids = new Set<string>();
  value.forEach((item, index) => {
    const path = `$.sourceArtifacts[${index}]`;
    if (!isRecord(item)) {
      addIssue(issues, 'invalid-artifact', path, 'Artifact must be an object.');
      return;
    }
    expectKeys(item, ['artifactId', 'sourceRef', 'uri', 'publisherId', 'version', 'sizeBytes', 'sha256', 'signature', 'license'], path, issues);
    const artifactId = expectString(item.artifactId, `${path}.artifactId`, issues);
    if (artifactId && ids.has(artifactId)) addIssue(issues, 'duplicate-artifact-id', `${path}.artifactId`, 'Artifact IDs must be unique.');
    if (artifactId) ids.add(artifactId);
    expectString(item.sourceRef, `${path}.sourceRef`, issues);
    if (typeof item.uri !== 'string' || !isHttpsUri(item.uri)) {
      addIssue(issues, 'insecure-artifact-source', `${path}.uri`, 'Artifact URI must be an explicit HTTPS URL.');
    }
    expectString(item.publisherId, `${path}.publisherId`, issues);
    if (item.version === 'latest') addIssue(issues, 'unlocked-artifact-version', `${path}.version`, 'Artifact version cannot be latest.');
    else expectString(item.version, `${path}.version`, issues);
    if (!Number.isInteger(item.sizeBytes) || Number(item.sizeBytes) <= 0) addIssue(issues, 'invalid-artifact-size', `${path}.sizeBytes`, 'Artifact size must be a positive integer.');
    expectPattern(item.sha256, SHA256_PATTERN, `${path}.sha256`, 'invalid-artifact-digest', issues);
    validateArtifactSignature(item.signature, item, path, issues);
    validateLicense(item.license, path, issues);
  });
}

function validateArtifactSignature(value: unknown, artifact: Record<string, unknown>, path: string, issues: InstallPlanValidationIssue[]) {
  if (value === null) return;
  if (!isRecord(value)) {
    addIssue(issues, 'invalid-signature', `${path}.signature`, 'Signature must be null or a structured requirement.');
    return;
  }
  expectKeys(value, ['publisherId', 'artifactSha256', 'status'], `${path}.signature`, issues);
  expectEnum(value.status, ['verified', 'unverified'], `${path}.signature.status`, issues);
  expectPattern(value.artifactSha256, SHA256_PATTERN, `${path}.signature.artifactSha256`, 'invalid-signature-digest', issues);
  if (value.artifactSha256 !== artifact.sha256 || value.publisherId !== artifact.publisherId) {
    addIssue(issues, 'signature-artifact-conflict', `${path}.signature`, 'Signature publisher or digest conflicts with the artifact lock.');
  }
}

function validateLicense(value: unknown, path: string, issues: InstallPlanValidationIssue[]) {
  if (!isRecord(value)) {
    addIssue(issues, 'invalid-license', `${path}.license`, 'License declaration must be an object.');
    return;
  }
  expectKeys(value, ['identifier', 'url'], `${path}.license`, issues);
  expectString(value.identifier, `${path}.license.identifier`, issues);
  if (typeof value.url !== 'string' || !isHttpsUri(value.url)) addIssue(issues, 'invalid-license-url', `${path}.license.url`, 'License URL must use HTTPS.');
}

function validatePreconditions(value: unknown, issues: InstallPlanValidationIssue[]) {
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(issues, 'invalid-preconditions', '$.preconditions', 'At least one precondition is required.');
    return;
  }
  const ids = new Set<string>();
  value.forEach((item, index) => {
    const path = `$.preconditions[${index}]`;
    if (!isRecord(item)) {
      addIssue(issues, 'invalid-precondition', path, 'Precondition must be an object.');
      return;
    }
    expectKeys(item, ['preconditionId', 'kind', 'parameters', 'onFailure'], path, issues);
    const id = expectString(item.preconditionId, `${path}.preconditionId`, issues);
    if (id && ids.has(id)) addIssue(issues, 'duplicate-precondition-id', `${path}.preconditionId`, 'Precondition IDs must be unique.');
    if (id) ids.add(id);
    expectEnum(item.kind, ['platform-match', 'disk-space', 'source-reachable', 'policy-allowed', 'existing-path-selected'], `${path}.kind`, issues);
    expectEnum(item.onFailure, ['stop-rejected', 'stop-unknown', 'request-user-decision'], `${path}.onFailure`, issues);
    if (item.parameters !== undefined && !isRecord(item.parameters)) addIssue(issues, 'invalid-precondition-parameters', `${path}.parameters`, 'Precondition parameters must be an object.');
  });
}

function validatePermissions(value: unknown, issues: InstallPlanValidationIssue[]) {
  if (!isRecord(value)) {
    addIssue(issues, 'invalid-permissions', '$.permissions', 'PermissionManifest must be an object.');
    return;
  }
  expectKeys(value, ['network', 'elevation', 'filesystemReads', 'filesystemWrites', 'pathMutation', 'shellProfileMutation', 'serviceChanges', 'processLaunches', 'credentialAccess'], '$.permissions', issues);
  validateNetwork(value.network, issues);
  validateElevation(value.elevation, issues);
  validatePathScopes(value.filesystemReads, '$.permissions.filesystemReads', issues);
  validatePathScopes(value.filesystemWrites, '$.permissions.filesystemWrites', issues, true);
  validatePathMutation(value.pathMutation, issues);
  validateShellProfileMutation(value.shellProfileMutation, issues);
  validateServiceChanges(value.serviceChanges, issues);
  validateProcessLaunches(value.processLaunches, issues);
  validateCredentialAccess(value.credentialAccess, issues);
}

function validateNetwork(value: unknown, issues: InstallPlanValidationIssue[]) {
  const path = '$.permissions.network';
  if (!isRecord(value)) return addIssue(issues, 'invalid-network-permission', path, 'Network permission must be an object.');
  expectKeys(value, ['required', 'hosts', 'purposes'], path, issues);
  expectBoolean(value.required, `${path}.required`, issues);
  expectStringArray(value.hosts, `${path}.hosts`, issues);
  expectStringArray(value.purposes, `${path}.purposes`, issues);
  if (value.required === true && (asArray(value.hosts).length === 0 || asArray(value.purposes).length === 0)) {
    addIssue(issues, 'network-scope-missing', path, 'Required network access needs explicit hosts and purposes.');
  }
}

function validateElevation(value: unknown, issues: InstallPlanValidationIssue[]) {
  const path = '$.permissions.elevation';
  if (!isRecord(value)) return addIssue(issues, 'invalid-elevation-permission', path, 'Elevation permission must be an object.');
  expectKeys(value, ['required', 'reason', 'promptStepId'], path, issues);
  expectBoolean(value.required, `${path}.required`, issues);
  if (value.required === true) {
    expectString(value.reason, `${path}.reason`, issues);
    expectString(value.promptStepId, `${path}.promptStepId`, issues);
  } else if (value.promptStepId !== null) {
    addIssue(issues, 'unexpected-elevation-prompt', `${path}.promptStepId`, 'Non-elevated plans cannot declare an elevation prompt.');
  }
}

function validatePathScopes(value: unknown, path: string, issues: InstallPlanValidationIssue[], writes = false) {
  if (!Array.isArray(value)) return addIssue(issues, 'invalid-path-scopes', path, 'Path scopes must be an array.');
  const ids = new Set<string>();
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(item)) return addIssue(issues, 'invalid-path-scope', itemPath, 'Path scope must be an object.');
    expectKeys(item, ['scopeId', 'locationKind', 'path', 'operations', 'purpose'], itemPath, issues);
    const id = expectString(item.scopeId, `${itemPath}.scopeId`, issues);
    if (id && ids.has(id)) addIssue(issues, 'duplicate-path-scope', `${itemPath}.scopeId`, 'Path scope IDs must be unique within the list.');
    if (id) ids.add(id);
    expectEnum(item.locationKind, ['exact-file', 'exact-directory', 'user-selected', 'hub-data'], `${itemPath}.locationKind`, issues);
    if (item.locationKind === 'user-selected') {
      if (item.path !== null) addIssue(issues, 'user-selected-path-must-be-null', `${itemPath}.path`, 'User-selected paths must be resolved at review time.');
    } else if (typeof item.path !== 'string' || !isBoundedPath(item.path)) {
      addIssue(issues, 'unbounded-path', `${itemPath}.path`, 'Path must be bounded and cannot contain traversal or unresolved variables.');
    }
    expectStringArray(item.operations, `${itemPath}.operations`, issues);
    expectString(item.purpose, `${itemPath}.purpose`, issues);
    if (writes && asArray(item.operations).some((operation) => !['create', 'replace', 'delete', 'write'].includes(String(operation)))) {
      addIssue(issues, 'invalid-write-operation', `${itemPath}.operations`, 'Filesystem writes must use explicit write operations.');
    }
  });
}

function validatePathMutation(value: unknown, issues: InstallPlanValidationIssue[]) {
  const path = '$.permissions.pathMutation';
  if (!isRecord(value)) return addIssue(issues, 'invalid-path-mutation', path, 'PATH mutation declaration must be an object.');
  expectKeys(value, ['required', 'scope', 'previousValueCapture'], path, issues);
  expectBoolean(value.required, `${path}.required`, issues);
  expectBoolean(value.previousValueCapture, `${path}.previousValueCapture`, issues);
  if (value.required === true && (typeof value.scope !== 'string' || value.previousValueCapture !== true)) {
    addIssue(issues, 'path-mutation-unrecoverable', path, 'PATH mutation needs a bounded scope and previous-value capture.');
  }
  if (value.required === false && value.scope !== null) addIssue(issues, 'unexpected-path-scope', `${path}.scope`, 'Disabled PATH mutation must have null scope.');
}

function validateShellProfileMutation(value: unknown, issues: InstallPlanValidationIssue[]) {
  const path = '$.permissions.shellProfileMutation';
  if (!isRecord(value)) return addIssue(issues, 'invalid-shell-profile-mutation', path, 'Shell profile declaration must be an object.');
  expectKeys(value, ['required', 'files', 'previousValueCapture'], path, issues);
  expectBoolean(value.required, `${path}.required`, issues);
  expectStringArray(value.files, `${path}.files`, issues);
  expectBoolean(value.previousValueCapture, `${path}.previousValueCapture`, issues);
  if (value.required === true && (asArray(value.files).length === 0 || value.previousValueCapture !== true)) {
    addIssue(issues, 'shell-profile-mutation-unrecoverable', path, 'Shell profile mutation needs exact files and previous-value capture.');
  }
}

function validateServiceChanges(value: unknown, issues: InstallPlanValidationIssue[]) {
  const path = '$.permissions.serviceChanges';
  if (!Array.isArray(value)) return addIssue(issues, 'invalid-service-changes', path, 'Service changes must be an array.');
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(item)) return addIssue(issues, 'invalid-service-change', itemPath, 'Service effect must be an object.');
    expectKeys(item, ['serviceName', 'operation', 'purpose', 'reversible', 'confirmation'], itemPath, issues);
    expectString(item.serviceName, `${itemPath}.serviceName`, issues);
    expectEnum(item.operation, ['install', 'start', 'stop', 'remove'], `${itemPath}.operation`, issues);
    expectString(item.purpose, `${itemPath}.purpose`, issues);
    expectBoolean(item.reversible, `${itemPath}.reversible`, issues);
    expectEnum(item.confirmation, ['separate-elevation', 'separate-destructive'], `${itemPath}.confirmation`, issues);
  });
}

function validateProcessLaunches(value: unknown, issues: InstallPlanValidationIssue[]) {
  const path = '$.permissions.processLaunches';
  if (!Array.isArray(value)) return addIssue(issues, 'invalid-process-launches', path, 'Process launches must be an array.');
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(item)) return addIssue(issues, 'invalid-process-launch', itemPath, 'Process effect must be an object.');
    expectKeys(item, ['executableId', 'argsTemplate', 'purpose', 'requiresElevation', 'confirmation'], itemPath, issues);
    expectString(item.executableId, `${itemPath}.executableId`, issues);
    expectStringArray(item.argsTemplate, `${itemPath}.argsTemplate`, issues);
    expectString(item.purpose, `${itemPath}.purpose`, issues);
    expectBoolean(item.requiresElevation, `${itemPath}.requiresElevation`, issues);
    expectEnum(item.confirmation, ['plan-consent', 'separate-elevation', 'separate-destructive'], `${itemPath}.confirmation`, issues);
    if (asArray(item.argsTemplate).some((arg) => typeof arg !== 'string' || SHELL_META_PATTERN.test(arg))) {
      addIssue(issues, 'raw-command-forbidden', `${itemPath}.argsTemplate`, 'Process arguments cannot contain shell metacharacters.');
    }
    if (item.requiresElevation === true && item.confirmation !== 'separate-elevation') {
      addIssue(issues, 'implicit-elevation', `${itemPath}.confirmation`, 'Elevated process launch needs separate elevation consent.');
    }
  });
}

function validateCredentialAccess(value: unknown, issues: InstallPlanValidationIssue[]) {
  const path = '$.permissions.credentialAccess';
  if (!isRecord(value)) return addIssue(issues, 'invalid-credential-access', path, 'Credential access declaration must be an object.');
  expectKeys(value, ['required', 'kinds'], path, issues);
  expectBoolean(value.required, `${path}.required`, issues);
  expectStringArray(value.kinds, `${path}.kinds`, issues);
  if (value.required === true || asArray(value.kinds).length > 0) addIssue(issues, 'credential-access-forbidden', path, 'v0.1 InstallPlan cannot access credentials.');
}

function validateSteps(value: unknown, permissions: unknown, artifacts: unknown, journalPolicy: unknown, issues: InstallPlanValidationIssue[]) {
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(issues, 'invalid-steps', '$.steps', 'At least one structured step is required.');
    return;
  }
  const ids = new Set<string>();
  value.forEach((item, index) => {
    const path = `$.steps[${index}]`;
    if (!isRecord(item)) return addIssue(issues, 'invalid-step', path, 'Install step must be an object.');
    expectKeys(item, ['stepId', 'kind', 'dependsOn', 'inputRefs', 'effects', 'confirmation', 'cancellability', 'timeoutSeconds', 'idempotency', 'compensationStepIds', 'successEvidence', 'auditEventKinds'], path, issues);
    const id = expectString(item.stepId, `${path}.stepId`, issues);
    if (id && ids.has(id)) addIssue(issues, 'duplicate-step-id', `${path}.stepId`, 'Step IDs must be unique.');
    if (id) ids.add(id);
    if (typeof item.kind !== 'string' || !ALLOWED_STEP_KINDS.has(item.kind as InstallStep['kind'])) {
      addIssue(issues, 'step-kind-forbidden', `${path}.kind`, 'Step kind is not in the v0.1 allowlist.');
    }
    expectStringArray(item.dependsOn, `${path}.dependsOn`, issues);
    expectStringArray(item.inputRefs, `${path}.inputRefs`, issues);
    validateStepEffects(item.effects, path, permissions, artifacts, journalPolicy, asArray(item.compensationStepIds), item.confirmation, issues);
    expectEnum(item.confirmation, ['none', 'plan-consent', 'separate-elevation', 'separate-destructive'], `${path}.confirmation`, issues);
    expectEnum(item.cancellability, ['before-start', 'cooperative', 'non-interruptible'], `${path}.cancellability`, issues);
    if (!Number.isInteger(item.timeoutSeconds) || Number(item.timeoutSeconds) <= 0) addIssue(issues, 'invalid-step-timeout', `${path}.timeoutSeconds`, 'Step timeout must be a positive integer.');
    expectEnum(item.idempotency, ['safe-repeat', 'check-before-repeat', 'never-repeat'], `${path}.idempotency`, issues);
    expectStringArray(item.compensationStepIds, `${path}.compensationStepIds`, issues);
    validateEvidence(item.successEvidence, `${path}.successEvidence`, issues, false);
    expectStringArray(item.auditEventKinds, `${path}.auditEventKinds`, issues);
    const events = asArray(item.auditEventKinds);
    if (!['step-started', 'step-succeeded', 'step-failed'].every((event) => events.includes(event))) {
      addIssue(issues, 'audit-events-incomplete', `${path}.auditEventKinds`, 'Each step needs start, success and failure audit events.');
    }
  });

  const stepIds = new Set(value.filter(isRecord).map((step) => step.stepId).filter((id): id is string => typeof id === 'string'));
  value.filter(isRecord).forEach((step, index) => {
    asArray(step.dependsOn).forEach((dependency) => {
      if (typeof dependency !== 'string' || !stepIds.has(dependency)) addIssue(issues, 'unknown-step-dependency', `$.steps[${index}].dependsOn`, 'Step dependency does not exist.');
    });
    asArray(step.compensationStepIds).forEach((compensation) => {
      if (typeof compensation !== 'string' || !stepIds.has(compensation)) addIssue(issues, 'unknown-compensation-step', `$.steps[${index}].compensationStepIds`, 'Compensation step does not exist.');
    });
  });
  if (hasDependencyCycle(value.filter(isRecord))) addIssue(issues, 'step-cycle', '$.steps', 'Install steps must form an acyclic DAG.');

  if (isRecord(permissions) && isRecord(permissions.elevation) && permissions.elevation.required === true) {
    const promptId = permissions.elevation.promptStepId;
    const prompt = value.find((step) => isRecord(step) && step.stepId === promptId);
    if (!isRecord(prompt) || prompt.kind !== 'request-elevation-consent' || prompt.confirmation !== 'separate-elevation') {
      addIssue(issues, 'implicit-elevation', '$.permissions.elevation.promptStepId', 'Elevation requires a dedicated consent step.');
    }
  }
}

function validateStepEffects(value: unknown, stepPath: string, permissions: unknown, artifacts: unknown, journalPolicy: unknown, compensationIds: unknown[], confirmation: unknown, issues: InstallPlanValidationIssue[]) {
  const path = `${stepPath}.effects`;
  if (!Array.isArray(value)) return addIssue(issues, 'invalid-step-effects', path, 'Step effects must be an array.');
  value.forEach((effect, index) => {
    const effectPath = `${path}[${index}]`;
    if (!isRecord(effect)) return addIssue(issues, 'invalid-step-effect', effectPath, 'Step effect must be an object.');
    expectKeys(effect, ['kind', 'scopeRef', 'reversible'], effectPath, issues);
    const kind = expectString(effect.kind, `${effectPath}.kind`, issues);
    if (kind && FORBIDDEN_EFFECT_KINDS.has(kind)) addIssue(issues, 'raw-command-forbidden', `${effectPath}.kind`, 'Raw command, auto-login, task start and Connector mutation effects are forbidden.');
    const category = effectPermissionCategory(kind);
    if (!category) {
      addIssue(issues, 'undeclared-effect', effectPath, 'Effect kind is not mapped to PermissionManifest.');
      return;
    }
    if (!isEffectDeclared(effect, category, permissions, artifacts)) addIssue(issues, 'undeclared-effect', effectPath, 'Effect scope is not declared in PermissionManifest or sourceArtifacts.');
    if (['path', 'profile', 'service'].includes(category) && !['separate-elevation', 'separate-destructive'].includes(String(confirmation))) {
      addIssue(issues, 'separate-consent-missing', stepPath, 'PATH, shell profile and service changes need separate consent.');
    }
    if (category === 'write') {
      expectBoolean(effect.reversible, `${effectPath}.reversible`, issues);
      const journalAllowsAtomicEvidence = isRecord(journalPolicy) && journalPolicy.atomicWrite === true && journalPolicy.lastKnownGood === true && isHubDataWrite(effect, permissions);
      if (effect.reversible === true && compensationIds.length === 0 && !journalAllowsAtomicEvidence) {
        addIssue(issues, 'recovery-step-missing', stepPath, 'Reversible machine writes need an authorized compensation step.');
      }
      if (effect.reversible === false && confirmation !== 'separate-destructive') {
        addIssue(issues, 'destructive-consent-missing', stepPath, 'Irreversible writes need separate destructive consent.');
      }
    }
  });
}

function validateEvidence(value: unknown, path: string, issues: InstallPlanValidationIssue[], requireInstalled: boolean) {
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(issues, 'invalid-success-evidence', path, 'Structured success evidence is required.');
    return;
  }
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(item)) return addIssue(issues, 'invalid-evidence-requirement', itemPath, 'Evidence requirement must be an object.');
    expectKeys(item, ['subject', 'assessment', 'evidenceKinds'], itemPath, issues);
    expectString(item.subject, `${itemPath}.subject`, issues);
    expectExact(item.assessment, 'verified', `${itemPath}.assessment`, 'invalid-evidence-assessment', issues);
    if (item.evidenceKinds !== undefined) expectStringArray(item.evidenceKinds, `${itemPath}.evidenceKinds`, issues);
  });
  if (requireInstalled && !value.some((item) => isRecord(item) && item.subject === 'lifecycle.installed' && item.assessment === 'verified')) {
    addIssue(issues, 'installed-evidence-missing', path, 'Plan success must require verified lifecycle.installed evidence.');
  }
}

function validateMethodSteps(method: unknown, steps: unknown, artifacts: unknown, issues: InstallPlanValidationIssue[]) {
  if (!Array.isArray(steps)) return;
  const kinds = new Set(steps.filter(isRecord).map((step) => step.kind).filter((kind): kind is string => typeof kind === 'string'));
  const requirements: Record<string, string[]> = {
    'existing-install': ['verify-primary-executable', 'record-installation-evidence'],
    'official-guidance': ['open-official-guidance', 'verify-primary-executable'],
    'package-manager': ['resolve-package-version', 'invoke-package-manager', 'verify-primary-executable', 'verify-installed-version'],
    'official-installer': ['download-official-artifact', 'verify-artifact-hash', 'invoke-official-installer', 'verify-primary-executable', 'verify-installed-version']
  };
  for (const requiredKind of requirements[String(method)] ?? []) {
    if (!kinds.has(requiredKind)) addIssue(issues, 'method-step-missing', '$.steps', `${String(method)} requires ${requiredKind}.`);
  }
  if (asArray(artifacts).some((artifact) => isRecord(artifact) && artifact.signature !== null) && !kinds.has('verify-publisher-signature')) {
    addIssue(issues, 'signature-step-missing', '$.steps', 'Signed artifacts require an explicit publisher-signature verification step.');
  }
}

function validateArtifactNetworkScopes(method: unknown, artifacts: unknown, permissions: unknown, issues: InstallPlanValidationIssue[]) {
  if (!['official-installer', 'package-manager'].includes(String(method)) || !Array.isArray(artifacts)) return;
  if (!isRecord(permissions) || !isRecord(permissions.network) || permissions.network.required !== true) {
    addIssue(issues, 'artifact-network-undeclared', '$.permissions.network', 'Artifact retrieval requires declared network access.');
    return;
  }
  const hosts = asArray(permissions.network.hosts);
  artifacts.forEach((artifact, index) => {
    if (!isRecord(artifact) || typeof artifact.uri !== 'string') return;
    try {
      const hostname = new URL(artifact.uri).hostname;
      if (!hosts.includes(hostname)) addIssue(issues, 'artifact-host-undeclared', `$.sourceArtifacts[${index}].uri`, 'Artifact hostname is not declared in PermissionManifest.');
    } catch {
      // URI validation owns malformed-source errors.
    }
  });
}

function validatePolicies(plan: Record<string, unknown>, issues: InstallPlanValidationIssue[]) {
  const failure = plan.failurePolicy;
  if (!isRecord(failure)) addIssue(issues, 'invalid-failure-policy', '$.failurePolicy', 'Failure policy must be an object.');
  else {
    expectKeys(failure, ['defaultAction', 'recoverOnPartialEffect', 'manualDecisionOnUnknown'], '$.failurePolicy', issues);
    expectExact(failure.defaultAction, 'stop', '$.failurePolicy.defaultAction', 'unsafe-failure-policy', issues);
    expectExact(failure.recoverOnPartialEffect, true, '$.failurePolicy.recoverOnPartialEffect', 'recovery-disabled', issues);
    expectExact(failure.manualDecisionOnUnknown, true, '$.failurePolicy.manualDecisionOnUnknown', 'unknown-auto-decision', issues);
  }
  const cancellation = plan.cancellationPolicy;
  if (!isRecord(cancellation)) addIssue(issues, 'invalid-cancellation-policy', '$.cancellationPolicy', 'Cancellation policy must be an object.');
  else {
    expectKeys(cancellation, ['startNoNewNormalStep', 'runAuthorizedCompensation', 'preserveJournal'], '$.cancellationPolicy', issues);
    expectExact(cancellation.startNoNewNormalStep, true, '$.cancellationPolicy.startNoNewNormalStep', 'unsafe-cancellation-policy', issues);
    expectExact(cancellation.runAuthorizedCompensation, true, '$.cancellationPolicy.runAuthorizedCompensation', 'unsafe-cancellation-policy', issues);
    expectExact(cancellation.preserveJournal, true, '$.cancellationPolicy.preserveJournal', 'unsafe-cancellation-policy', issues);
  }
  const journal = plan.journalPolicy;
  if (!isRecord(journal)) addIssue(issues, 'invalid-journal-policy', '$.journalPolicy', 'Journal policy must be an object.');
  else {
    expectKeys(journal, ['atomicWrite', 'hashChain', 'lastKnownGood', 'redactSecrets'], '$.journalPolicy', issues);
    for (const key of ['atomicWrite', 'hashChain', 'lastKnownGood', 'redactSecrets'] as const) {
      expectExact(journal[key], true, `$.journalPolicy.${key}`, 'unsafe-journal-policy', issues);
    }
  }
}

function validateProvenance(value: unknown, issues: InstallPlanValidationIssue[]) {
  const path = '$.provenance';
  if (!isRecord(value)) return addIssue(issues, 'invalid-provenance', path, 'Provenance must be an object.');
  expectKeys(value, ['authoredBy', 'createdAt', 'sourceEvidenceRefs'], path, issues);
  expectString(value.authoredBy, `${path}.authoredBy`, issues);
  expectString(value.createdAt, `${path}.createdAt`, issues);
  expectStringArray(value.sourceEvidenceRefs, `${path}.sourceEvidenceRefs`, issues);
}

function validateIntegrity(value: unknown, issues: InstallPlanValidationIssue[]) {
  const path = '$.integrity';
  if (!isRecord(value)) return addIssue(issues, 'invalid-integrity', path, 'Document integrity must be an object.');
  expectKeys(value, ['algorithm', 'documentSha256', 'signature'], path, issues);
  expectExact(value.algorithm, 'sha256', `${path}.algorithm`, 'integrity-algorithm-unsupported', issues);
  if (value.documentSha256 !== null) expectPattern(value.documentSha256, SHA256_PATTERN, `${path}.documentSha256`, 'invalid-document-digest', issues);
  if (value.signature !== null) {
    validateArtifactSignature(value.signature, { sha256: value.documentSha256, publisherId: isRecord(value.signature) ? value.signature.publisherId : null }, path, issues);
  }
}

function effectPermissionCategory(kind: string | null): 'read' | 'write' | 'network' | 'path' | 'profile' | 'service' | 'process' | 'artifact' | null {
  if (!kind) return null;
  if (['read-user-selected-file', 'read-file-metadata'].includes(kind)) return 'read';
  if (['write-hub-evidence', 'remove-partial-artifact', 'restore-previous-state'].includes(kind)) return 'write';
  if (kind === 'network-request') return 'network';
  if (kind === 'mutate-path') return 'path';
  if (kind === 'mutate-shell-profile') return 'profile';
  if (kind === 'change-service') return 'service';
  if (kind === 'launch-process') return 'process';
  if (['download-artifact', 'verify-artifact'].includes(kind)) return 'artifact';
  return null;
}

function isEffectDeclared(effect: Record<string, unknown>, category: ReturnType<typeof effectPermissionCategory>, permissions: unknown, artifacts: unknown): boolean {
  if (!isRecord(permissions)) return false;
  const scopeRef = typeof effect.scopeRef === 'string' ? effect.scopeRef : '';
  if (category === 'read') return asArray(permissions.filesystemReads).some((scope) => isRecord(scope) && scope.scopeId === scopeRef);
  if (category === 'write') return asArray(permissions.filesystemWrites).some((scope) => isRecord(scope) && scope.scopeId === scopeRef);
  if (category === 'network') return isRecord(permissions.network) && permissions.network.required === true && asArray(permissions.network.hosts).includes(scopeRef);
  if (category === 'path') return isRecord(permissions.pathMutation) && permissions.pathMutation.required === true && permissions.pathMutation.scope === scopeRef;
  if (category === 'profile') return isRecord(permissions.shellProfileMutation) && permissions.shellProfileMutation.required === true && asArray(permissions.shellProfileMutation.files).includes(scopeRef);
  if (category === 'service') return asArray(permissions.serviceChanges).some((service) => isRecord(service) && service.serviceName === scopeRef);
  if (category === 'process') return asArray(permissions.processLaunches).some((process) => isRecord(process) && process.executableId === scopeRef);
  if (category === 'artifact') return asArray(artifacts).some((artifact) => isRecord(artifact) && artifact.artifactId === scopeRef);
  return false;
}

function isHubDataWrite(effect: Record<string, unknown>, permissions: unknown): boolean {
  if (!isRecord(permissions)) return false;
  return asArray(permissions.filesystemWrites).some((scope) => (
    isRecord(scope) && scope.scopeId === effect.scopeRef && scope.locationKind === 'hub-data'
  ));
}

function hasDependencyCycle(steps: Record<string, unknown>[]): boolean {
  const dependencies = new Map<string, string[]>();
  steps.forEach((step) => {
    if (typeof step.stepId === 'string') dependencies.set(step.stepId, asArray(step.dependsOn).filter((item): item is string => typeof item === 'string'));
  });
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dependency of dependencies.get(id) ?? []) if (visit(dependency)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return [...dependencies.keys()].some(visit);
}

function rejectedReview(agentId: string, displayName: string, issues: InstallPlanValidationIssue[], planId: string | null = null): InstallPlanReview {
  return {
    agentId,
    displayName,
    planId,
    status: 'rejected',
    executionEnabled: false,
    document: null,
    summary: null,
    consent: null,
    issues
  };
}

function expectKeys(value: Record<string, unknown>, allowed: readonly string[], path: string, issues: InstallPlanValidationIssue[]) {
  const allowedSet = new Set(allowed);
  Object.keys(value).forEach((key) => {
    if (!allowedSet.has(key)) addIssue(issues, 'unknown-field', `${path}.${key}`, 'Unknown fields are rejected.');
  });
}

function expectString(value: unknown, path: string, issues: InstallPlanValidationIssue[]): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    addIssue(issues, 'invalid-string', path, 'Expected a non-empty string.');
    return null;
  }
  return value;
}

function expectBoolean(value: unknown, path: string, issues: InstallPlanValidationIssue[]) {
  if (typeof value !== 'boolean') addIssue(issues, 'invalid-boolean', path, 'Expected a boolean.');
}

function expectStringArray(value: unknown, path: string, issues: InstallPlanValidationIssue[]) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.length === 0)) addIssue(issues, 'invalid-string-array', path, 'Expected an array of non-empty strings.');
}

function expectEnum(value: unknown, allowed: readonly string[], path: string, issues: InstallPlanValidationIssue[]) {
  if (typeof value !== 'string' || !allowed.includes(value)) addIssue(issues, 'invalid-enum', path, `Expected one of: ${allowed.join(', ')}.`);
}

function expectExact(value: unknown, expected: unknown, path: string, code: string, issues: InstallPlanValidationIssue[]) {
  if (value !== expected) addIssue(issues, code, path, `Expected ${String(expected)}.`);
}

function expectPattern(value: unknown, pattern: RegExp, path: string, code: string, issues: InstallPlanValidationIssue[]) {
  if (typeof value !== 'string' || !pattern.test(value)) addIssue(issues, code, path, 'Value does not match the required format.');
}

function addIssue(issues: InstallPlanValidationIssue[], code: string, path: string, message: string) {
  issues.push({ code, path, message, severity: 'error' });
}

function addPending(issues: InstallPlanValidationIssue[], code: string, path: string, message: string) {
  issues.push({ code, path, message, severity: 'pending' });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isHttpsUri(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isBoundedPath(value: string): boolean {
  return value.length > 0
    && !value.includes('..')
    && !/%[^%]+%|\$\{|\*\*|^[A-Za-z]:\\?$|^[\\/]+$/.test(value);
}

function clonePathScope(scope: InstallPathScope): InstallPathScope {
  return { ...scope, operations: [...scope.operations] };
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
