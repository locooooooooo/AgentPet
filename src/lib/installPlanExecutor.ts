import {
  buildInstallConsentPreview,
  reviewAgentInstallPlan,
  type AgentInstallPlan,
  type InstallConsentPreview,
  type InstallPlanReview,
  type InstallStep
} from './agentInstallPlan';
import {
  buildInstallRunEffectDigest,
  createInstallRun,
  recoverInstallRun,
  type InstallRunAuthorization,
  type InstallRunBindingInput,
  type InstallRunDependencies,
  type InstallRunJournalMachine,
  type InstallRunSnapshot
} from './installRunJournal';

export type InstallPlanOperation = 'install' | 'update' | 'repair' | 'uninstall';
export type InstallPlanExecutionOutcome =
  | 'execution-ready'
  | 'blocked'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'recovered'
  | 'recovery-failed'
  | 'partial-rollback';

export interface InstallPlanExecutionAuthorization {
  /** Explicit second gate. A review-only projection never supplies this value. */
  execute: true;
  planId: string;
  planVersion: string;
  agentId: string;
  /** The exact binding shown by buildInstallConsentPreview. */
  consentBinding?: string;
  /** Digest of consentBinding. This is accepted for callers that persist only digests. */
  consentDigest?: string;
  /** Hash of operation plus the ordered Plan effects. */
  effectDigest: string;
}

export interface InstallPlanExecutionRequest {
  review: InstallPlanReview;
  authorization: InstallPlanExecutionAuthorization;
  runId: string;
  operation: InstallPlanOperation;
  hash: InstallRunDependencies['hash'];
  dependencies: InstallPlanExecutorDependencies;
}

export interface InstallPlanExecutorDependencies extends Omit<InstallRunDependencies, 'executeEffect' | 'executeCompensation'> {
  executeEffect: InstallRunDependencies['executeEffect'];
  executeCompensation: InstallRunDependencies['executeCompensation'];
}

export interface InstallPlanExecutionIssue {
  code: string;
  path: string;
  message: string;
}

export interface InstallPlanExecutionAdmission {
  outcome: 'execution-ready' | 'blocked';
  executionEligible: boolean;
  operation: InstallPlanOperation;
  plan: AgentInstallPlan | null;
  consent: InstallConsentPreview | null;
  binding: InstallRunBindingInput | null;
  authorization: InstallRunAuthorization | null;
  issues: InstallPlanExecutionIssue[];
}

export interface InstallPlanExecutionResult {
  outcome: InstallPlanExecutionOutcome;
  operation: InstallPlanOperation;
  snapshot: InstallRunSnapshot | null;
  admission: InstallPlanExecutionAdmission;
  issues: InstallPlanExecutionIssue[];
}

export function buildInstallPlanExecutionEffectDigest(
  plan: AgentInstallPlan,
  operation: InstallPlanOperation,
  hash: InstallRunDependencies['hash']
): string {
  return buildInstallRunEffectDigest(toRunSteps(plan, operation, hash), hash);
}

export function buildInstallPlanExecutionConsentDigest(
  plan: AgentInstallPlan,
  hash: InstallRunDependencies['hash']
): string {
  return hash(buildInstallConsentPreview(plan).binding);
}

export class InstallPlanExecutionError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = 'InstallPlanExecutionError';
    this.code = code;
  }
}

/**
 * Re-evaluates the review document and seals a separate execution binding.
 * `valid-review-only` is intentionally insufficient without `authorization.execute`.
 */
export function evaluateInstallPlanExecution(
  request: Pick<InstallPlanExecutionRequest, 'review' | 'authorization' | 'runId' | 'operation' | 'hash'>
): InstallPlanExecutionAdmission {
  const issues: InstallPlanExecutionIssue[] = [];
  const { review, authorization, runId, operation, hash } = request;
  const plan = review?.document ?? null;
  const hashValid = validateHash(hash, issues);
  if (!isOperation(operation)) addIssue(issues, 'operation-invalid', '$.operation', 'Operation must be install, update, repair or uninstall.');
  if (!isNonEmptyString(runId)) addIssue(issues, 'run-id-invalid', '$.runId', 'A non-empty runId is required.');
  if (!isRecord(review)) {
    addIssue(issues, 'review-missing', '$.review', 'A reviewed InstallPlan is required.');
  } else {
    if (review.status !== 'valid-review-only') addIssue(issues, 'review-not-valid', '$.review.status', 'Only a valid review-only plan may be considered for execution.');
    if (review.executionEnabled !== false) addIssue(issues, 'review-execution-flag-invalid', '$.review.executionEnabled', 'Review projections cannot enable execution.');
    if (review.issues.some((issue) => issue.severity === 'error' || issue.severity === 'pending')) {
      addIssue(issues, 'review-has-open-issues', '$.review.issues', 'The reviewed Plan still has pending or rejected findings.');
    }
    if (!review.consent) addIssue(issues, 'review-consent-missing', '$.review.consent', 'Review consent preview is required.');
  }
  if (!plan) {
    addIssue(issues, 'plan-missing', '$.review.document', 'A Plan document is required.');
  } else {
    if (review.planId !== plan.planId) addIssue(issues, 'review-plan-id-drift', '$.review.planId', 'Review planId no longer matches its document.');
    if (review.agentId !== plan.agentId) addIssue(issues, 'review-agent-id-drift', '$.review.agentId', 'Review agentId no longer matches its document.');
    if (plan.lifecycle !== 'accepted' && plan.lifecycle !== 'distributed') addIssue(issues, 'plan-not-distributed', '$.review.document.lifecycle', 'Only distributed or accepted Plans may execute.');
    if (plan.integrity.documentSha256 === null || plan.integrity.signature?.status !== 'verified') {
      addIssue(issues, 'plan-integrity-unverified', '$.review.document.integrity', 'Plan document integrity and signature must be verified.');
    }
    const freshReview = reviewAgentInstallPlan(plan, review.displayName);
    if (freshReview.status !== 'valid-review-only' || freshReview.issues.length > 0) {
      addIssue(issues, 'review-document-drift', '$.review.document', 'The document no longer matches its reviewed, fail-closed projection.');
    }
    if (stableStringify(review.summary) !== stableStringify(freshReview.summary)) {
      addIssue(issues, 'review-summary-drift', '$.review.summary', 'Review summary no longer matches the current Plan document.');
    }
    if (review.consent && !sameConsent(review.consent, buildInstallConsentPreview(plan))) {
      addIssue(issues, 'consent-binding-drift', '$.review.consent', 'Consent preview no longer binds to the reviewed Plan.');
    }
    validateOrderedDag(plan.steps, issues);
  }
  if (hashValid) validateAuthorization(authorization, plan, review.consent, operation, hash, runId, issues);

  if (issues.length > 0 || !plan || !isOperation(operation)) {
    return {
      outcome: 'blocked',
      executionEligible: false,
      operation,
      plan: null,
      consent: plan && review.consent ? buildInstallConsentPreview(plan) : null,
      binding: null,
      authorization: null,
      issues
    };
  }

  const consent = buildInstallConsentPreview(plan);
  const consentDigest = hash(consent.binding);
  const orderedSteps = toRunSteps(plan, operation, hash);
  const effectDigest = buildInstallRunEffectDigest(orderedSteps, hash);
  const binding: InstallRunBindingInput = {
    runId,
    planId: plan.planId,
    planVersion: plan.planVersion,
    agentId: plan.agentId,
    consentDigest,
    effectDigest,
    orderedSteps,
    authorizedCompensationStepIds: orderedSteps.flatMap((step) => step.rollback.mode === 'compensate'
      ? [step.rollback.compensation.stepId]
      : [])
  };
  const runAuthorization: InstallRunAuthorization = {
    runId,
    planId: plan.planId,
    planVersion: plan.planVersion,
    agentId: plan.agentId,
    consentDigest,
    effectDigest
  };
  return {
    outcome: 'execution-ready',
    executionEligible: true,
    operation,
    plan: structuredClone(plan),
    consent: structuredClone(consent),
    binding: structuredClone(binding),
    authorization: structuredClone(runAuthorization),
    issues: []
  };
}

export class InstallPlanExecutor {
  readonly admission: InstallPlanExecutionAdmission;
  private readonly machine: InstallRunJournalMachine | null;

  private constructor(
    admission: InstallPlanExecutionAdmission,
    machine: InstallRunJournalMachine | null
  ) {
    this.admission = admission;
    this.machine = machine;
  }

  static create(request: InstallPlanExecutionRequest): InstallPlanExecutor {
    const admission = evaluateInstallPlanExecution(request);
    if (admission.outcome === 'blocked' || !admission.binding || !admission.authorization) {
      return new InstallPlanExecutor(admission, null);
    }
    const dependencies: InstallRunDependencies = {
      hash: request.hash,
      now: request.dependencies.now,
      executeEffect: request.dependencies.executeEffect,
      executeCompensation: request.dependencies.executeCompensation
    };
    try {
      return new InstallPlanExecutor(admission, createInstallRun(admission.binding, dependencies));
    } catch (error) {
      const issue = { code: errorCode(error), path: '$.binding', message: 'InstallRun binding rejected fail-closed.' };
      return new InstallPlanExecutor({ ...admission, outcome: 'blocked', executionEligible: false, binding: null, authorization: null, issues: [issue] }, null);
    }
  }

  get state(): InstallPlanExecutionOutcome {
    return this.machine ? stateOutcome(this.machine.state) : 'blocked';
  }

  snapshot(): InstallRunSnapshot | null {
    return this.machine?.snapshot() ?? null;
  }

  start(): InstallPlanExecutionResult {
    if (!this.machine || !this.admission.authorization) return this.currentResult('blocked', this.admission.issues);
    try {
      this.machine.start(this.admission.authorization);
      return this.currentResult('execution-ready', []);
    } catch (error) {
      return this.currentResult('blocked', [executionIssue(error, '$.run')]);
    }
  }

  async advance(): Promise<InstallPlanExecutionResult> {
    if (!this.machine || !this.admission.authorization) return this.currentResult('blocked', this.admission.issues);
    try {
      const snapshot = await this.machine.advance(this.admission.authorization);
      return this.currentResult(stateOutcome(snapshot.state), []);
    } catch (error) {
      return this.currentResult('blocked', [executionIssue(error, '$.run')]);
    }
  }

  async cancel(): Promise<InstallPlanExecutionResult> {
    if (!this.machine || !this.admission.authorization) return this.currentResult('blocked', this.admission.issues);
    try {
      await this.machine.requestCancel();
      return this.currentResult(stateOutcome(this.machine.state), []);
    } catch (error) {
      return this.currentResult('blocked', [executionIssue(error, '$.run')]);
    }
  }

  currentResult(outcome: InstallPlanExecutionOutcome, issues: InstallPlanExecutionIssue[]): InstallPlanExecutionResult {
    return {
      outcome,
      operation: this.admission.operation,
      snapshot: this.machine?.snapshot() ?? null,
      admission: this.admission,
      issues
    };
  }
}

export function createInstallPlanExecutor(request: InstallPlanExecutionRequest): InstallPlanExecutor {
  return InstallPlanExecutor.create(request);
}

export async function executeInstallPlan(request: InstallPlanExecutionRequest): Promise<InstallPlanExecutionResult> {
  const executor = InstallPlanExecutor.create(request);
  if (executor.admission.outcome === 'blocked') return executor.currentResult('blocked', executor.admission.issues);
  executor.start();
  let result = executor.currentResult('execution-ready', []);
  while (result.snapshot && result.snapshot.state === 'running') result = await executor.advance();
  return result;
}

export async function recoverInstallPlanExecution(
  request: Omit<InstallPlanExecutionRequest, 'runId'> & { snapshot: InstallRunSnapshot }
): Promise<InstallPlanExecutionResult> {
  const admission = evaluateInstallPlanExecution({ ...request, runId: request.snapshot.binding.runId });
  if (admission.outcome === 'blocked' || !admission.authorization) {
    return { outcome: 'blocked', operation: admission.operation, snapshot: null, admission, issues: admission.issues };
  }
  const dependencies: InstallRunDependencies = {
    hash: request.hash,
    now: request.dependencies.now,
    executeEffect: request.dependencies.executeEffect,
    executeCompensation: request.dependencies.executeCompensation
  };
  const result = await recoverInstallRun(request.snapshot, admission.authorization, dependencies);
  if (result.status === 'recovery-failed') {
    return {
      outcome: 'recovery-failed',
      operation: admission.operation,
      snapshot: null,
      admission,
      issues: [{ code: result.reason, path: '$.snapshot', message: 'Recovery failed closed without invoking effects.' }]
    };
  }
  const snapshot = result.machine.snapshot();
  return {
    outcome: stateOutcome(snapshot.state),
    operation: admission.operation,
    snapshot,
    admission,
    issues: []
  };
}

function validateAuthorization(
  authorization: InstallPlanExecutionAuthorization | undefined,
  plan: AgentInstallPlan | null,
  consent: InstallConsentPreview | null | undefined,
  operation: InstallPlanOperation,
  hash: InstallRunDependencies['hash'],
  runId: string,
  issues: InstallPlanExecutionIssue[]
) {
  if (!isRecord(authorization) || authorization.execute !== true) {
    addIssue(issues, 'explicit-execution-consent-required', '$.authorization.execute', 'Explicit execution authorization is required; review-only is never executable.');
    return;
  }
  if (!plan || !consent) return;
  if (authorization.planId !== plan.planId) addIssue(issues, 'plan-id-drift', '$.authorization.planId', 'Authorization planId does not match the reviewed Plan.');
  if (authorization.planVersion !== plan.planVersion) addIssue(issues, 'plan-version-drift', '$.authorization.planVersion', 'Authorization planVersion does not match the reviewed Plan.');
  if (authorization.agentId !== plan.agentId) addIssue(issues, 'agent-id-drift', '$.authorization.agentId', 'Authorization agentId does not match the reviewed Plan.');
  if (authorization.consentBinding !== undefined && authorization.consentBinding !== consent.binding) addIssue(issues, 'consent-binding-drift', '$.authorization.consentBinding', 'Authorization consent binding does not match the reviewed Plan.');
  const expectedConsentDigest = hash(consent.binding);
  if (authorization.consentDigest !== undefined && authorization.consentDigest !== expectedConsentDigest) addIssue(issues, 'consent-digest-drift', '$.authorization.consentDigest', 'Authorization consent digest does not match the reviewed Plan.');
  if (authorization.consentBinding === undefined && authorization.consentDigest === undefined) addIssue(issues, 'consent-binding-missing', '$.authorization', 'Authorization must bind the reviewed consent preview.');
  const expectedEffects = toRunSteps(plan, operation, hash);
  const expectedEffectDigest = buildInstallRunEffectDigest(expectedEffects, hash);
  if (authorization.effectDigest !== expectedEffectDigest) addIssue(issues, 'effect-binding-drift', '$.authorization.effectDigest', 'Authorization effects do not match the ordered Plan and operation.');
  if (!isNonEmptyString(runId)) addIssue(issues, 'run-id-invalid', '$.runId', 'A non-empty runId is required.');
}

function toRunSteps(plan: AgentInstallPlan, operation: InstallPlanOperation, hash: InstallRunDependencies['hash']) {
  return plan.steps.map((step) => {
    const compensation = step.compensationStepIds[0];
    const compensationStepId = compensation ? `compensate:${step.stepId}:${compensation}` : null;
    return {
      stepId: step.stepId,
      dependsOn: [...step.dependsOn],
      effectDigest: hash(stableStringify({ operation, step: projectStep(step) })),
      cancellability: step.cancellability === 'non-interruptible' ? 'non-interruptible' as const : 'cooperative' as const,
      rollback: compensationStepId
        ? { mode: 'compensate' as const, compensation: { stepId: compensationStepId, effectDigest: hash(stableStringify({ operation, stepId: step.stepId, compensation })) } }
        : { mode: 'none-required' as const }
    };
  });
}

function projectStep(step: InstallStep) {
  return {
    stepId: step.stepId,
    kind: step.kind,
    dependsOn: step.dependsOn,
    inputRefs: step.inputRefs,
    effects: step.effects,
    confirmation: step.confirmation,
    cancellability: step.cancellability,
    compensationStepIds: step.compensationStepIds,
    idempotency: step.idempotency
  };
}

function validateOrderedDag(steps: readonly InstallStep[], issues: InstallPlanExecutionIssue[]) {
  if (steps.length === 0) {
    addIssue(issues, 'empty-step-dag', '$.review.document.steps', 'At least one execution step is required.');
    return;
  }
  const ids = new Set<string>();
  steps.forEach((step, index) => {
    if (ids.has(step.stepId)) addIssue(issues, 'duplicate-step-id', `$.review.document.steps[${index}].stepId`, 'Step IDs must be unique.');
    ids.add(step.stepId);
    for (const dependency of step.dependsOn) {
      if (!ids.has(dependency)) addIssue(issues, 'ordered-dag-invalid', `$.review.document.steps[${index}].dependsOn`, 'Dependencies must exist earlier in the ordered Plan.');
    }
  });
  const graph = new Map(steps.map((step) => [step.stepId, step.dependsOn]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dependency of graph.get(id) ?? []) if (visit(dependency)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  if ([...graph.keys()].some(visit)) addIssue(issues, 'step-cycle', '$.review.document.steps', 'Execution steps must form an acyclic DAG.');
}

function sameConsent(left: InstallConsentPreview, right: InstallConsentPreview): boolean {
  return left.binding === right.binding
    && left.planId === right.planId
    && left.planVersion === right.planVersion
    && left.manifestVersionRange === right.manifestVersionRange
    && left.effectsFingerprint === right.effectsFingerprint
    && JSON.stringify(left.artifactDigests) === JSON.stringify(right.artifactDigests);
}

function stateOutcome(state: InstallRunSnapshot['state']): InstallPlanExecutionOutcome {
  if (state === 'partial-rollback') return 'partial-rollback';
  if (state === 'recovery-failed') return 'recovery-failed';
  if (state === 'succeeded' || state === 'failed' || state === 'cancelled' || state === 'recovered') return state;
  return 'execution-ready';
}

function addIssue(issues: InstallPlanExecutionIssue[], code: string, path: string, message: string) {
  if (!issues.some((issue) => issue.code === code && issue.path === path)) issues.push({ code, path, message });
}

function validateHash(hash: unknown, issues: InstallPlanExecutionIssue[]): hash is InstallRunDependencies['hash'] {
  if (typeof hash !== 'function') {
    addIssue(issues, 'hash-dependency-missing', '$.hash', 'A deterministic SHA-256 hash dependency is required.');
    return false;
  }
  try {
    if (!/^[a-f0-9]{64}$/.test(hash('install-plan-executor-probe'))) {
      addIssue(issues, 'hash-result-invalid', '$.hash', 'Hash dependency must return a lowercase SHA-256 digest.');
      return false;
    }
  } catch {
    addIssue(issues, 'hash-dependency-failed', '$.hash', 'Hash dependency failed during the admission probe.');
    return false;
  }
  return true;
}

function executionIssue(error: unknown, path: string): InstallPlanExecutionIssue {
  const code = errorCode(error);
  return { code, path, message: 'InstallPlan execution rejected fail-closed.' };
}

function errorCode(error: unknown): string {
  return error instanceof Error && 'code' in error && typeof error.code === 'string' ? error.code : 'install-plan-execution-failed';
}

function isOperation(value: unknown): value is InstallPlanOperation {
  return value === 'install' || value === 'update' || value === 'repair' || value === 'uninstall';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}
