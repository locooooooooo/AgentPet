import {
  ADAPTER_CAPABILITY_MAX_AGE_MS,
  computeAdapterCapabilityDigest,
  evaluateAdapterCapability,
  type AdapterCapabilityDocument,
  type AdapterCapabilityEvaluation,
  type AdapterCapabilityEvaluationContext
} from './adapterCapability';
import {
  admitDependencyWorkflow,
  applyDependencyTaskTerminalReceipt,
  cancelDependencyWorkflow,
  dispatchNextDependencyTask,
  validateDependencyWorkflowAudit,
  type DependencyDispatchIntent,
  type DependencyTaskTerminalReceipt,
  type DependencyWorkflowIssue,
  type DependencyWorkflowState
} from './dependencyWorkflow';
import {
  InstallRunInvariantError,
  createInstallRun,
  recoverInstallRun,
  type InstallRunAuthorization,
  type InstallRunBindingInput,
  type InstallRunCancelDecision,
  type InstallRunDependencies,
  type InstallRunJournalMachine,
  type InstallRunSnapshot
} from './installRunJournal';

export interface HubExecutionIssue {
  code: string;
  path: string;
}

export interface HubAdapterPairIdentity {
  agentId: string;
  adapterId: string;
  connectorId: string;
}

export interface HubAdmittedAdapterPair extends HubAdapterPairIdentity {
  adapterVersion: string;
  evidenceDigest: string;
  evidenceObservedAt: string;
  evidenceExpiresAt: string;
  evidenceRunId: string;
  peerId: string;
}

export interface HubAdapterPairAdmission {
  status: 'admitted' | 'rejected';
  applied: boolean;
  pair: HubAdmittedAdapterPair | null;
  evaluation: AdapterCapabilityEvaluation;
  issues: HubExecutionIssue[];
}

export interface HubPairRegistryMutation {
  applied: boolean;
  issues: HubExecutionIssue[];
}

export interface HubWorkflowAdmission {
  status: 'admitted' | 'rejected';
  executionEligible: boolean;
  workflow: DependencyWorkflowState | null;
  issues: HubExecutionIssue[];
}

export interface HubDependencyDispatchIntent extends DependencyDispatchIntent {
  connectorId: string;
  capabilityEvidenceDigest: string;
}

export interface HubWorkflowMutation {
  applied: boolean;
  workflow: DependencyWorkflowState | null;
  dispatch: HubDependencyDispatchIntent | null;
  issues: HubExecutionIssue[];
}

export interface HubInstallRunMutation {
  applied: boolean;
  snapshot: InstallRunSnapshot | null;
  cancelDecision: InstallRunCancelDecision | null;
  issues: HubExecutionIssue[];
}

interface WorkflowPairBinding extends HubAdapterPairIdentity {
  capabilityEvidenceDigest: string;
}

interface WorkflowRecord {
  workflow: DependencyWorkflowState;
  pairBindings: WorkflowPairBinding[];
}

const AUTHORIZATION_KEYS = [
  'runId',
  'planId',
  'planVersion',
  'agentId',
  'consentDigest',
  'effectDigest'
] as const;

export class HubExecutionCoordinator {
  private readonly admittedPairs = new Map<string, HubAdmittedAdapterPair>();
  private readonly workflows = new Map<string, WorkflowRecord>();
  private readonly installRuns = new Map<string, InstallRunJournalMachine>();

  registerAdapterCapability(
    document: unknown,
    context: AdapterCapabilityEvaluationContext
  ): HubAdapterPairAdmission {
    const evaluation = evaluateAdapterCapability(document, context);
    if (
      evaluation.assessment !== 'verified'
      || evaluation.executionEligible !== true
      || !isAdapterCapabilityDocument(document)
    ) {
      return {
        status: 'rejected',
        applied: false,
        pair: null,
        evaluation,
        issues: evaluation.findings.map(({ code, path }) => ({ code, path }))
      };
    }

    const evidenceDigest = computeAdapterCapabilityDigest(document);
    if (evidenceDigest !== document.evidence.digestSha256) {
      return {
        status: 'rejected',
        applied: false,
        pair: null,
        evaluation,
        issues: [{ code: 'capability-evidence-drift', path: '$.evidence.digestSha256' }]
      };
    }
    const pair: HubAdmittedAdapterPair = {
      agentId: document.adapter.agentId,
      adapterId: document.adapter.id,
      connectorId: document.adapter.connectorId,
      adapterVersion: document.adapter.version,
      evidenceDigest,
      evidenceObservedAt: document.evidence.observedAt,
      evidenceExpiresAt: new Date(
        Date.parse(document.evidence.observedAt) + (context.maxAgeMs ?? ADAPTER_CAPABILITY_MAX_AGE_MS)
      ).toISOString(),
      evidenceRunId: document.evidence.runId,
      peerId: document.evidence.peerId
    };
    const key = pairKey(pair);
    const current = this.admittedPairs.get(key);
    if (current && samePairEvidence(current, pair)) {
      return { status: 'admitted', applied: false, pair: clone(pair), evaluation, issues: [] };
    }
    this.admittedPairs.set(key, clone(pair));
    return { status: 'admitted', applied: true, pair: clone(pair), evaluation, issues: [] };
  }

  revokeAdapterPair(identity: HubAdapterPairIdentity, expectedEvidenceDigest: string): HubPairRegistryMutation {
    const key = pairKey(identity);
    const current = this.admittedPairs.get(key);
    if (!current) return { applied: false, issues: [{ code: 'adapter-pair-unknown', path: '$.pair' }] };
    if (current.evidenceDigest !== expectedEvidenceDigest) {
      return { applied: false, issues: [{ code: 'capability-evidence-drift', path: '$.expectedEvidenceDigest' }] };
    }
    this.admittedPairs.delete(key);
    return { applied: true, issues: [] };
  }

  listAdmittedAdapterPairs(): HubAdmittedAdapterPair[] {
    return [...this.admittedPairs.values()].map(clone).sort(comparePairs);
  }

  admitWorkflow(input: unknown, occurredAt: string): HubWorkflowAdmission {
    const timeIssues = this.expireAdapterPairsAt(occurredAt);
    const resolution = this.resolveWorkflowPairs(input);
    const admission = admitDependencyWorkflow(
      input,
      resolution.bindings.map(({ agentId, adapterId }) => ({ agentId, adapterId })),
      occurredAt
    );
    const issues = uniqueIssues([...timeIssues, ...resolution.issues, ...admission.issues]);
    if (
      issues.length > 0
      || admission.status !== 'admitted'
      || !admission.executionEligible
      || !admission.workflow
    ) {
      return { status: 'rejected', executionEligible: false, workflow: null, issues };
    }
    if (this.workflows.has(admission.workflow.workflowId)) {
      return {
        status: 'rejected',
        executionEligible: false,
        workflow: null,
        issues: [{ code: 'workflow-id-conflict', path: '$.workflowId' }]
      };
    }
    this.workflows.set(admission.workflow.workflowId, {
      workflow: admission.workflow,
      pairBindings: resolution.bindings.map(clone)
    });
    return {
      status: 'admitted',
      executionEligible: true,
      workflow: clone(admission.workflow),
      issues: []
    };
  }

  dispatchNextWorkflowTask(workflowId: string, occurredAt: string): HubWorkflowMutation {
    const record = this.workflows.get(workflowId);
    if (!record) return unknownWorkflow();
    const gateIssues = [
      ...this.expireAdapterPairsAt(occurredAt),
      ...this.validateWorkflowGate(record)
    ];
    if (gateIssues.length > 0) return workflowRejected(record.workflow, gateIssues);
    const result = dispatchNextDependencyTask(record.workflow, occurredAt);
    if (!result.applied || !result.dispatch) {
      return workflowRejected(record.workflow, result.issues);
    }
    const binding = record.pairBindings.find((candidate) =>
      candidate.agentId === result.dispatch!.agentId && candidate.adapterId === result.dispatch!.adapterId
    );
    if (!binding) {
      return workflowRejected(record.workflow, [{ code: 'workflow-pair-unknown', path: '$.dispatch' }]);
    }
    record.workflow = result.workflow;
    return {
      applied: true,
      workflow: clone(record.workflow),
      dispatch: {
        ...result.dispatch,
        connectorId: binding.connectorId,
        capabilityEvidenceDigest: binding.capabilityEvidenceDigest
      },
      issues: []
    };
  }

  applyWorkflowTerminalReceipt(
    workflowId: string,
    receipt: DependencyTaskTerminalReceipt,
    occurredAt: string
  ): HubWorkflowMutation {
    const record = this.workflows.get(workflowId);
    if (!record) return unknownWorkflow();
    const gateIssues = [
      ...this.expireAdapterPairsAt(occurredAt),
      ...this.validateWorkflowGate(record)
    ];
    if (gateIssues.length > 0) return workflowRejected(record.workflow, gateIssues);
    const result = applyDependencyTaskTerminalReceipt(record.workflow, receipt, occurredAt);
    if (result.applied) record.workflow = result.workflow;
    return {
      applied: result.applied,
      workflow: clone(record.workflow),
      dispatch: null,
      issues: uniqueIssues(result.issues)
    };
  }

  cancelWorkflow(workflowId: string, occurredAt: string): HubWorkflowMutation {
    const record = this.workflows.get(workflowId);
    if (!record) return unknownWorkflow();
    const timeIssues = this.expireAdapterPairsAt(occurredAt);
    if (timeIssues.length > 0) return workflowRejected(record.workflow, timeIssues);
    const result = cancelDependencyWorkflow(record.workflow, occurredAt);
    if (result.applied) record.workflow = result.workflow;
    return {
      applied: result.applied,
      workflow: clone(record.workflow),
      dispatch: null,
      issues: uniqueIssues(result.issues)
    };
  }

  getWorkflow(workflowId: string): DependencyWorkflowState | null {
    return clone(this.workflows.get(workflowId)?.workflow ?? null);
  }

  createInstallRun(
    binding: InstallRunBindingInput,
    authorization: InstallRunAuthorization,
    dependencies: InstallRunDependencies
  ): HubInstallRunMutation {
    const authorizationIssues = validateAuthorization(binding, authorization);
    if (authorizationIssues.length > 0) return installRejected(null, authorizationIssues);
    if (this.installRuns.has(binding.runId)) {
      return installRejected(this.installRuns.get(binding.runId)!.snapshot(), [
        { code: 'install-run-id-conflict', path: '$.binding.runId' }
      ]);
    }
    try {
      const machine = createInstallRun(binding, dependencies);
      this.installRuns.set(binding.runId, machine);
      return { applied: true, snapshot: machine.snapshot(), cancelDecision: null, issues: [] };
    } catch (error) {
      return installRejected(null, [{ code: installErrorCode(error), path: '$.binding' }]);
    }
  }

  startInstallRun(runId: string, authorization: InstallRunAuthorization): HubInstallRunMutation {
    const machine = this.installRuns.get(runId);
    if (!machine) return unknownInstallRun();
    const issues = validateAuthorization(machine.snapshot().binding, authorization);
    if (issues.length > 0) return installRejected(machine.snapshot(), issues);
    try {
      machine.start(authorization);
      return { applied: true, snapshot: machine.snapshot(), cancelDecision: null, issues: [] };
    } catch (error) {
      return installRejected(machine.snapshot(), [{ code: installErrorCode(error), path: '$.run' }]);
    }
  }

  async advanceInstallRun(
    runId: string,
    authorization: InstallRunAuthorization
  ): Promise<HubInstallRunMutation> {
    const machine = this.installRuns.get(runId);
    if (!machine) return unknownInstallRun();
    const issues = validateAuthorization(machine.snapshot().binding, authorization);
    if (issues.length > 0) return installRejected(machine.snapshot(), issues);
    try {
      const before = machine.snapshot();
      const snapshot = await machine.advance(authorization);
      return {
        applied: snapshot.journal.length !== before.journal.length,
        snapshot,
        cancelDecision: null,
        issues: []
      };
    } catch (error) {
      return installRejected(machine.snapshot(), [{ code: installErrorCode(error), path: '$.run' }]);
    }
  }

  async cancelInstallRun(
    runId: string,
    authorization: InstallRunAuthorization
  ): Promise<HubInstallRunMutation> {
    const machine = this.installRuns.get(runId);
    if (!machine) return unknownInstallRun();
    const issues = validateAuthorization(machine.snapshot().binding, authorization);
    if (issues.length > 0) return installRejected(machine.snapshot(), issues);
    try {
      const decision = await machine.requestCancel();
      return {
        applied: !decision.idempotent,
        snapshot: machine.snapshot(),
        cancelDecision: decision,
        issues: []
      };
    } catch (error) {
      return installRejected(machine.snapshot(), [{ code: installErrorCode(error), path: '$.run' }]);
    }
  }

  async recoverInstallRun(
    snapshot: InstallRunSnapshot,
    authorization: InstallRunAuthorization,
    dependencies: InstallRunDependencies
  ): Promise<HubInstallRunMutation> {
    const issues = validateAuthorization(snapshot?.binding, authorization);
    if (issues.length > 0) return installRejected(null, issues);
    if (this.installRuns.has(snapshot.binding.runId)) {
      return installRejected(this.installRuns.get(snapshot.binding.runId)!.snapshot(), [
        { code: 'install-run-id-conflict', path: '$.snapshot.binding.runId' }
      ]);
    }
    const result = await recoverInstallRun(snapshot, authorization, dependencies);
    if (result.status === 'recovery-failed') {
      return installRejected(null, [{ code: result.reason, path: '$.snapshot' }]);
    }
    this.installRuns.set(snapshot.binding.runId, result.machine);
    return { applied: true, snapshot: result.machine.snapshot(), cancelDecision: null, issues: [] };
  }

  getInstallRun(runId: string): InstallRunSnapshot | null {
    return clone(this.installRuns.get(runId)?.snapshot() ?? null);
  }

  private resolveWorkflowPairs(input: unknown): { bindings: WorkflowPairBinding[]; issues: HubExecutionIssue[] } {
    if (!isRecord(input) || !Array.isArray(input.tasks)) return { bindings: [], issues: [] };
    const bindings = new Map<string, WorkflowPairBinding>();
    const issues: HubExecutionIssue[] = [];
    input.tasks.forEach((task, index) => {
      if (!isRecord(task) || typeof task.agentId !== 'string' || typeof task.adapterId !== 'string') return;
      const candidates = [...this.admittedPairs.values()].filter((pair) =>
        pair.agentId === task.agentId && pair.adapterId === task.adapterId
      );
      if (candidates.length === 0) {
        issues.push({ code: 'workflow-pair-unknown', path: `$.tasks[${index}]` });
        return;
      }
      if (candidates.length > 1) {
        issues.push({ code: 'workflow-pair-ambiguous', path: `$.tasks[${index}]` });
        return;
      }
      const candidate = candidates[0];
      bindings.set(pairKey(candidate), {
        agentId: candidate.agentId,
        adapterId: candidate.adapterId,
        connectorId: candidate.connectorId,
        capabilityEvidenceDigest: candidate.evidenceDigest
      });
    });
    return { bindings: [...bindings.values()].sort(comparePairs), issues: uniqueIssues(issues) };
  }

  private validateWorkflowGate(record: WorkflowRecord): HubExecutionIssue[] {
    const issues = validateDependencyWorkflowAudit(record.workflow).map(({ code, path }) => ({ code, path }));
    for (const binding of record.pairBindings) {
      const current = this.admittedPairs.get(pairKey(binding));
      if (!current) {
        issues.push({ code: 'adapter-pair-revoked', path: `$.pairs.${binding.agentId}:${binding.adapterId}` });
      } else if (current.evidenceDigest !== binding.capabilityEvidenceDigest) {
        issues.push({ code: 'capability-evidence-drift', path: `$.pairs.${binding.agentId}:${binding.adapterId}` });
      }
    }
    return uniqueIssues(issues);
  }

  private expireAdapterPairsAt(occurredAt: string): HubExecutionIssue[] {
    const nowMs = Date.parse(occurredAt);
    if (!Number.isFinite(nowMs) || new Date(nowMs).toISOString() !== occurredAt) {
      return [{ code: 'event-time-invalid', path: '$.occurredAt' }];
    }
    for (const [key, pair] of this.admittedPairs) {
      if (nowMs - Date.parse(pair.evidenceExpiresAt) > 0) this.admittedPairs.delete(key);
    }
    return [];
  }
}

function validateAuthorization(
  binding: InstallRunBindingInput | undefined,
  authorization: InstallRunAuthorization
): HubExecutionIssue[] {
  if (!binding || !isRecord(authorization)) {
    return [{ code: 'install-authorization-missing', path: '$.authorization' }];
  }
  const issues: HubExecutionIssue[] = [];
  const unknownKeys = Object.keys(authorization).filter((key) => !AUTHORIZATION_KEYS.includes(key as typeof AUTHORIZATION_KEYS[number]));
  if (unknownKeys.length > 0) issues.push({ code: 'install-authorization-unknown-field', path: `$.authorization.${unknownKeys[0]}` });
  for (const key of AUTHORIZATION_KEYS) {
    if (typeof authorization[key] !== 'string' || authorization[key].length === 0) {
      issues.push({ code: 'install-authorization-missing', path: `$.authorization.${key}` });
    } else if (authorization[key] !== binding[key]) {
      issues.push({ code: `install-authorization-${camelToKebab(key)}-drift`, path: `$.authorization.${key}` });
    }
  }
  return uniqueIssues(issues);
}

function isAdapterCapabilityDocument(value: unknown): value is AdapterCapabilityDocument {
  return isRecord(value)
    && isRecord(value.adapter)
    && isRecord(value.evidence)
    && typeof value.adapter.id === 'string'
    && typeof value.adapter.version === 'string'
    && typeof value.adapter.agentId === 'string'
    && typeof value.adapter.connectorId === 'string'
    && typeof value.evidence.digestSha256 === 'string'
    && typeof value.evidence.observedAt === 'string'
    && typeof value.evidence.runId === 'string'
    && typeof value.evidence.peerId === 'string';
}

function workflowRejected(workflow: DependencyWorkflowState, issues: readonly HubExecutionIssue[]): HubWorkflowMutation {
  return { applied: false, workflow: clone(workflow), dispatch: null, issues: uniqueIssues(issues) };
}

function unknownWorkflow(): HubWorkflowMutation {
  return {
    applied: false,
    workflow: null,
    dispatch: null,
    issues: [{ code: 'workflow-unknown', path: '$.workflowId' }]
  };
}

function installRejected(snapshot: InstallRunSnapshot | null, issues: HubExecutionIssue[]): HubInstallRunMutation {
  return { applied: false, snapshot: clone(snapshot), cancelDecision: null, issues: uniqueIssues(issues) };
}

function unknownInstallRun(): HubInstallRunMutation {
  return installRejected(null, [{ code: 'install-run-unknown', path: '$.runId' }]);
}

function installErrorCode(error: unknown): string {
  return error instanceof InstallRunInvariantError ? error.code : 'install-run-error';
}

function samePairEvidence(left: HubAdmittedAdapterPair, right: HubAdmittedAdapterPair): boolean {
  return left.evidenceDigest === right.evidenceDigest
    && left.adapterVersion === right.adapterVersion
    && left.evidenceObservedAt === right.evidenceObservedAt
    && left.evidenceExpiresAt === right.evidenceExpiresAt
    && left.evidenceRunId === right.evidenceRunId
    && left.peerId === right.peerId;
}

function pairKey(identity: HubAdapterPairIdentity): string {
  return `${identity.agentId}\u001f${identity.adapterId}\u001f${identity.connectorId}`;
}

function comparePairs(left: HubAdapterPairIdentity, right: HubAdapterPairIdentity): number {
  return pairKey(left).localeCompare(pairKey(right));
}

function uniqueIssues<T extends DependencyWorkflowIssue | HubExecutionIssue>(issues: readonly T[]): HubExecutionIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.code}\u001f${issue.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(({ code, path }) => ({ code, path }));
}

function camelToKebab(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clone<T>(value: T): T {
  return value === undefined ? value : structuredClone(value);
}
