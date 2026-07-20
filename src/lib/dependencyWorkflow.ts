export type DependencyWorkflowStatus =
  | 'admitted'
  | 'running'
  | 'cancelling'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type DependencyTaskStatus =
  | 'waiting'
  | 'ready'
  | 'running'
  | 'cancelling'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'dependency-blocked';

export type DependencyWorkflowAuditKind =
  | 'workflow-admitted'
  | 'task-dispatched'
  | 'task-ready'
  | 'task-cancel-requested'
  | 'task-terminal'
  | 'dependency-blocked'
  | 'workflow-cancel-requested'
  | 'workflow-terminal';

export type DependencyFailureCode = 'execution-failed' | 'timed-out' | 'cancelled';

export interface AvailableAgentAdapterPair {
  agentId: string;
  adapterId: string;
}

export interface DependencyWorkflowTaskDefinition {
  taskId: string;
  agentId: string;
  adapterId: string;
  sessionId: string;
  runId: string;
  dependsOn: string[];
}

export interface DependencyWorkflowDefinition {
  schema: 'niuma.dependency-workflow';
  schemaVersion: '0.1.0';
  workflowId: string;
  tasks: DependencyWorkflowTaskDefinition[];
}

export interface DependencyWorkflowIssue {
  code: string;
  path: string;
}

export interface DependencyWorkflowTask extends DependencyWorkflowTaskDefinition {
  status: DependencyTaskStatus;
  terminalReceiptId?: string;
  terminalFailureCode?: DependencyFailureCode;
  artifactDigests: string[];
}

export interface DependencyWorkflowAuditEvent {
  eventId: string;
  sequence: number;
  occurredAt: string;
  kind: DependencyWorkflowAuditKind;
  workflowId: string;
  taskId?: string;
  agentId?: string;
  adapterId?: string;
  sessionId?: string;
  runId?: string;
  receiptId?: string;
  reason?: DependencyFailureCode | 'upstream-failed' | 'upstream-cancelled' | 'user-cancelled';
  dependencyTaskId?: string;
  artifactDigests?: string[];
}

export interface DependencyWorkflowState {
  schema: 'niuma.dependency-workflow-state';
  schemaVersion: '0.1.0';
  workflowId: string;
  status: DependencyWorkflowStatus;
  tasks: DependencyWorkflowTask[];
  audit: DependencyWorkflowAuditEvent[];
}

export interface DependencyDispatchIntent {
  workflowId: string;
  taskId: string;
  agentId: string;
  adapterId: string;
  sessionId: string;
  runId: string;
}

export interface DependencyTaskTerminalReceipt {
  receiptId: string;
  workflowId: string;
  taskId: string;
  agentId: string;
  adapterId: string;
  sessionId: string;
  runId: string;
  outcome: 'succeeded' | 'failed' | 'cancelled';
  failureCode?: DependencyFailureCode;
  artifactDigests: string[];
}

export interface DependencyWorkflowAdmission {
  status: 'admitted' | 'rejected';
  executionEligible: boolean;
  workflow: DependencyWorkflowState | null;
  issues: DependencyWorkflowIssue[];
}

export interface DependencyWorkflowMutation {
  applied: boolean;
  workflow: DependencyWorkflowState;
  dispatch: DependencyDispatchIntent | null;
  issues: DependencyWorkflowIssue[];
}

const DEFINITION_KEYS = ['schema', 'schemaVersion', 'workflowId', 'tasks'] as const;
const TASK_KEYS = ['taskId', 'agentId', 'adapterId', 'sessionId', 'runId', 'dependsOn'] as const;
const PAIR_KEYS = ['agentId', 'adapterId'] as const;
const RECEIPT_KEYS = [
  'receiptId', 'workflowId', 'taskId', 'agentId', 'adapterId', 'sessionId', 'runId',
  'outcome', 'failureCode', 'artifactDigests'
] as const;
const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const MAX_WORKFLOW_TASKS = 64;
const TERMINAL_TASK_STATUSES = new Set<DependencyTaskStatus>([
  'succeeded', 'failed', 'cancelled', 'dependency-blocked'
]);
const TERMINAL_WORKFLOW_STATUSES = new Set<DependencyWorkflowStatus>([
  'succeeded', 'failed', 'cancelled'
]);

export function admitDependencyWorkflow(
  input: unknown,
  availablePairs: readonly AvailableAgentAdapterPair[],
  occurredAt: string
): DependencyWorkflowAdmission {
  const issues: DependencyWorkflowIssue[] = [];
  validateAvailablePairs(availablePairs, issues);
  validateDefinition(input, availablePairs, issues);
  if (issues.length > 0 || !isRecord(input) || !Array.isArray(input.tasks)) {
    return { status: 'rejected', executionEligible: false, workflow: null, issues: uniqueIssues(issues) };
  }

  const definition = input as unknown as DependencyWorkflowDefinition;
  const tasks = definition.tasks
    .map((task) => ({
      ...task,
      dependsOn: [...task.dependsOn],
      status: task.dependsOn.length === 0 ? 'ready' as const : 'waiting' as const,
      artifactDigests: []
    }))
    .sort(compareTasks);
  const workflow: DependencyWorkflowState = {
    schema: 'niuma.dependency-workflow-state',
    schemaVersion: '0.1.0',
    workflowId: definition.workflowId,
    status: 'admitted',
    tasks,
    audit: []
  };
  return {
    status: 'admitted',
    executionEligible: true,
    workflow: appendAudit(workflow, occurredAt, 'workflow-admitted'),
    issues: []
  };
}

export function dispatchNextDependencyTask(
  workflow: DependencyWorkflowState,
  occurredAt: string
): DependencyWorkflowMutation {
  if (TERMINAL_WORKFLOW_STATUSES.has(workflow.status) || workflow.status === 'cancelling') {
    return mutationIssue(workflow, 'workflow-not-dispatchable', '$.status');
  }
  const task = [...workflow.tasks].filter((candidate) => candidate.status === 'ready').sort(compareTasks)[0];
  if (!task) {
    return mutationIssue(workflow, 'no-ready-task', '$.tasks');
  }

  let next = updateTask(workflow, task.taskId, (current) => ({ ...current, status: 'running' }));
  next = { ...next, status: 'running' };
  next = appendTaskAudit(next, occurredAt, 'task-dispatched', task);
  return {
    applied: true,
    workflow: next,
    dispatch: dispatchIntent(next.workflowId, task),
    issues: []
  };
}

export function applyDependencyTaskTerminalReceipt(
  workflow: DependencyWorkflowState,
  input: unknown,
  occurredAt: string
): DependencyWorkflowMutation {
  const receiptIssues = validateReceiptShape(input);
  if (receiptIssues.length > 0 || !isRecord(input)) {
    return { applied: false, workflow, dispatch: null, issues: receiptIssues };
  }
  const receipt = input as unknown as DependencyTaskTerminalReceipt;
  const task = workflow.tasks.find((candidate) => candidate.taskId === receipt.taskId);
  if (!task) {
    return mutationIssue(workflow, 'task-not-found', '$.taskId');
  }
  const identityIssues = validateReceiptIdentity(workflow, task, receipt);
  if (identityIssues.length > 0) {
    return { applied: false, workflow, dispatch: null, issues: identityIssues };
  }
  if (TERMINAL_TASK_STATUSES.has(task.status)) {
    const sameReceipt = task.terminalReceiptId === receipt.receiptId
      && task.status === receipt.outcome
      && task.terminalFailureCode === receipt.failureCode
      && sameStrings(task.artifactDigests, normalizeDigests(receipt.artifactDigests));
    return sameReceipt
      ? { applied: false, workflow, dispatch: null, issues: [] }
      : mutationIssue(workflow, 'terminal-transition-conflict', '$.receiptId');
  }
  if (task.status !== 'running' && task.status !== 'cancelling') {
    return mutationIssue(workflow, 'task-not-running', '$.taskId');
  }

  const artifactDigests = normalizeDigests(receipt.artifactDigests);
  let next = updateTask(workflow, task.taskId, (current) => ({
    ...current,
    status: receipt.outcome,
    terminalReceiptId: receipt.receiptId,
    terminalFailureCode: receipt.failureCode,
    artifactDigests
  }));
  const terminalTask = next.tasks.find((candidate) => candidate.taskId === task.taskId)!;
  next = appendTaskAudit(next, occurredAt, 'task-terminal', terminalTask, {
    receiptId: receipt.receiptId,
    reason: receipt.failureCode,
    artifactDigests
  });
  next = advanceDependencyTasks(next, terminalTask, occurredAt);
  next = finalizeWorkflowIfTerminal(next, occurredAt);
  return { applied: true, workflow: next, dispatch: null, issues: [] };
}

export function cancelDependencyWorkflow(
  workflow: DependencyWorkflowState,
  occurredAt: string
): DependencyWorkflowMutation {
  if (TERMINAL_WORKFLOW_STATUSES.has(workflow.status)) {
    return { applied: false, workflow, dispatch: null, issues: [] };
  }
  if (workflow.status === 'cancelling') {
    return { applied: false, workflow, dispatch: null, issues: [] };
  }

  let next = appendAudit(
    { ...workflow, status: 'cancelling' },
    occurredAt,
    'workflow-cancel-requested',
    { reason: 'user-cancelled' }
  );
  for (const task of next.tasks) {
    if (task.status === 'running') {
      next = updateTask(next, task.taskId, (current) => ({ ...current, status: 'cancelling' }));
      next = appendTaskAudit(next, occurredAt, 'task-cancel-requested', task, { reason: 'user-cancelled' });
      continue;
    }
    if (task.status === 'ready' || task.status === 'waiting') {
      next = updateTask(next, task.taskId, (current) => ({
        ...current,
        status: 'cancelled',
        terminalFailureCode: 'cancelled',
        artifactDigests: []
      }));
      const cancelledTask = next.tasks.find((candidate) => candidate.taskId === task.taskId)!;
      next = appendTaskAudit(next, occurredAt, 'task-terminal', cancelledTask, {
        reason: 'cancelled',
        artifactDigests: []
      });
    }
  }
  next = finalizeWorkflowIfTerminal(next, occurredAt);
  return { applied: true, workflow: next, dispatch: null, issues: [] };
}

export function getReadyDependencyTaskIds(workflow: DependencyWorkflowState): string[] {
  return workflow.tasks.filter((task) => task.status === 'ready').sort(compareTasks).map((task) => task.taskId);
}

export function validateDependencyWorkflowAudit(workflow: DependencyWorkflowState): DependencyWorkflowIssue[] {
  const issues: DependencyWorkflowIssue[] = [];
  const eventIds = new Set<string>();
  let expectedSequence = 1;
  for (const [index, event] of workflow.audit.entries()) {
    const path = `$.audit[${index}]`;
    if (event.sequence !== expectedSequence) {
      issues.push({ code: 'audit-sequence-invalid', path: `${path}.sequence` });
    }
    expectedSequence += 1;
    if (eventIds.has(event.eventId)) {
      issues.push({ code: 'audit-event-duplicate', path: `${path}.eventId` });
    }
    eventIds.add(event.eventId);
    if (event.workflowId !== workflow.workflowId) {
      issues.push({ code: 'audit-workflow-mismatch', path: `${path}.workflowId` });
    }
    if (event.taskId) {
      const task = workflow.tasks.find((candidate) => candidate.taskId === event.taskId);
      if (!task) {
        issues.push({ code: 'audit-task-unknown', path: `${path}.taskId` });
      } else if (
        event.agentId !== task.agentId
        || event.adapterId !== task.adapterId
        || event.sessionId !== task.sessionId
        || event.runId !== task.runId
      ) {
        issues.push({ code: 'audit-identity-mismatch', path });
      }
    }
    if (event.artifactDigests?.some((digest) => !SHA256_PATTERN.test(digest))) {
      issues.push({ code: 'audit-digest-invalid', path: `${path}.artifactDigests` });
    }
  }
  return uniqueIssues(issues);
}

function validateDefinition(
  input: unknown,
  availablePairs: readonly AvailableAgentAdapterPair[],
  issues: DependencyWorkflowIssue[]
) {
  if (!isRecord(input)) {
    issues.push({ code: 'invalid-definition', path: '$' });
    return;
  }
  expectExactKeys(input, DEFINITION_KEYS, '$', issues);
  expectExact(input.schema, 'niuma.dependency-workflow', '$.schema', 'schema-unsupported', issues);
  expectExact(input.schemaVersion, '0.1.0', '$.schemaVersion', 'schema-version-unsupported', issues);
  expectId(input.workflowId, '$.workflowId', issues);
  if (!Array.isArray(input.tasks) || input.tasks.length < 2 || input.tasks.length > MAX_WORKFLOW_TASKS) {
    issues.push({ code: 'workflow-task-count-invalid', path: '$.tasks' });
    return;
  }

  const taskIds = new Set<string>();
  const agentIds = new Set<string>();
  const adapterIds = new Set<string>();
  const sessionIds = new Set<string>();
  const runIds = new Set<string>();
  for (const [index, value] of input.tasks.entries()) {
    const path = `$.tasks[${index}]`;
    if (!isRecord(value)) {
      issues.push({ code: 'invalid-task', path });
      continue;
    }
    expectExactKeys(value, TASK_KEYS, path, issues);
    expectId(value.taskId, `${path}.taskId`, issues);
    expectId(value.agentId, `${path}.agentId`, issues);
    expectId(value.adapterId, `${path}.adapterId`, issues);
    expectId(value.sessionId, `${path}.sessionId`, issues);
    expectId(value.runId, `${path}.runId`, issues);
    addDuplicate(value.taskId, taskIds, 'duplicate-task', `${path}.taskId`, issues);
    addDuplicate(value.sessionId, sessionIds, 'duplicate-session', `${path}.sessionId`, issues);
    addDuplicate(value.runId, runIds, 'duplicate-run', `${path}.runId`, issues);
    if (typeof value.agentId === 'string') agentIds.add(value.agentId);
    if (typeof value.adapterId === 'string') adapterIds.add(value.adapterId);
    validateDependencies(value.dependsOn, value.taskId, path, issues);
  }

  if (agentIds.size !== 2) issues.push({ code: 'two-distinct-agents-required', path: '$.tasks' });
  if (adapterIds.size !== 2) issues.push({ code: 'two-distinct-adapters-required', path: '$.tasks' });
  const knownTaskIds = new Set(input.tasks.flatMap((task) => (
    isRecord(task) && typeof task.taskId === 'string' ? [task.taskId] : []
  )));
  let dependencyCount = 0;
  for (const [index, value] of input.tasks.entries()) {
    if (!isRecord(value) || !Array.isArray(value.dependsOn)) continue;
    dependencyCount += value.dependsOn.length;
    for (const [dependencyIndex, dependencyTaskId] of value.dependsOn.entries()) {
      if (typeof dependencyTaskId === 'string' && !knownTaskIds.has(dependencyTaskId)) {
        issues.push({ code: 'dependency-unknown', path: `$.tasks[${index}].dependsOn[${dependencyIndex}]` });
      }
    }
  }
  if (dependencyCount === 0) issues.push({ code: 'dependency-required', path: '$.tasks' });
  if (hasDependencyCycle(input.tasks)) issues.push({ code: 'dependency-cycle', path: '$.tasks' });

  const available = new Set(availablePairs.map(pairKey));
  for (const [index, value] of input.tasks.entries()) {
    if (!isRecord(value) || typeof value.agentId !== 'string' || typeof value.adapterId !== 'string') continue;
    if (!available.has(pairKey(value as unknown as AvailableAgentAdapterPair))) {
      issues.push({ code: 'agent-adapter-unavailable', path: `$.tasks[${index}]` });
    }
  }
}

function validateDependencies(value: unknown, taskId: unknown, path: string, issues: DependencyWorkflowIssue[]) {
  if (!Array.isArray(value)) {
    issues.push({ code: 'invalid-dependencies', path: `${path}.dependsOn` });
    return;
  }
  const seen = new Set<string>();
  for (const [index, dependency] of value.entries()) {
    const dependencyPath = `${path}.dependsOn[${index}]`;
    if (typeof dependency !== 'string' || !ID_PATTERN.test(dependency)) {
      issues.push({ code: 'invalid-dependency-id', path: dependencyPath });
      continue;
    }
    if (dependency === taskId) issues.push({ code: 'dependency-self', path: dependencyPath });
    if (seen.has(dependency)) issues.push({ code: 'dependency-duplicate', path: dependencyPath });
    seen.add(dependency);
  }
}

function validateAvailablePairs(pairs: readonly AvailableAgentAdapterPair[], issues: DependencyWorkflowIssue[]) {
  if (!Array.isArray(pairs)) {
    issues.push({ code: 'available-pairs-invalid', path: '$availablePairs' });
    return;
  }
  const seen = new Set<string>();
  for (const [index, pair] of pairs.entries()) {
    const path = `$availablePairs[${index}]`;
    if (!isRecord(pair)) {
      issues.push({ code: 'available-pair-invalid', path });
      continue;
    }
    expectExactKeys(pair, PAIR_KEYS, path, issues);
    expectId(pair.agentId, `${path}.agentId`, issues);
    expectId(pair.adapterId, `${path}.adapterId`, issues);
    if (typeof pair.agentId === 'string' && typeof pair.adapterId === 'string') {
      const key = pairKey(pair as unknown as AvailableAgentAdapterPair);
      if (seen.has(key)) issues.push({ code: 'available-pair-duplicate', path });
      seen.add(key);
    }
  }
}

function validateReceiptShape(input: unknown): DependencyWorkflowIssue[] {
  const issues: DependencyWorkflowIssue[] = [];
  if (!isRecord(input)) return [{ code: 'invalid-receipt', path: '$' }];
  expectExactKeys(input, RECEIPT_KEYS, '$', issues, ['failureCode']);
  for (const key of ['receiptId', 'workflowId', 'taskId', 'agentId', 'adapterId', 'sessionId', 'runId']) {
    expectId(input[key], `$.${key}`, issues);
  }
  if (!['succeeded', 'failed', 'cancelled'].includes(String(input.outcome))) {
    issues.push({ code: 'receipt-outcome-invalid', path: '$.outcome' });
  }
  if (!Array.isArray(input.artifactDigests)
    || input.artifactDigests.some((digest) => typeof digest !== 'string' || !SHA256_PATTERN.test(digest))) {
    issues.push({ code: 'artifact-digest-invalid', path: '$.artifactDigests' });
  } else if (new Set(input.artifactDigests).size !== input.artifactDigests.length) {
    issues.push({ code: 'artifact-digest-duplicate', path: '$.artifactDigests' });
  }
  if (input.outcome === 'succeeded' && input.failureCode !== undefined) {
    issues.push({ code: 'success-failure-code-forbidden', path: '$.failureCode' });
  }
  if (input.outcome === 'failed' && !['execution-failed', 'timed-out'].includes(String(input.failureCode))) {
    issues.push({ code: 'failure-code-invalid', path: '$.failureCode' });
  }
  if (input.outcome === 'cancelled' && input.failureCode !== 'cancelled') {
    issues.push({ code: 'cancellation-code-invalid', path: '$.failureCode' });
  }
  return uniqueIssues(issues);
}

function validateReceiptIdentity(
  workflow: DependencyWorkflowState,
  task: DependencyWorkflowTask,
  receipt: DependencyTaskTerminalReceipt
): DependencyWorkflowIssue[] {
  const issues: DependencyWorkflowIssue[] = [];
  if (receipt.workflowId !== workflow.workflowId) issues.push({ code: 'receipt-workflow-mismatch', path: '$.workflowId' });
  for (const key of ['agentId', 'adapterId', 'sessionId', 'runId'] as const) {
    if (receipt[key] !== task[key]) issues.push({ code: `receipt-${key.replace('Id', '')}-mismatch`, path: `$.${key}` });
  }
  return issues;
}

function advanceDependencyTasks(
  workflow: DependencyWorkflowState,
  terminalTask: DependencyWorkflowTask,
  occurredAt: string
): DependencyWorkflowState {
  let next = workflow;
  let changed = true;
  while (changed) {
    changed = false;
    for (const candidate of [...next.tasks].sort(compareTasks)) {
      if (candidate.status !== 'waiting') continue;
      const dependencies = candidate.dependsOn.map((taskId) => next.tasks.find((task) => task.taskId === taskId)!);
      const failedDependency = dependencies.find((dependency) => (
        dependency.status === 'failed'
        || dependency.status === 'cancelled'
        || dependency.status === 'dependency-blocked'
      ));
      if (failedDependency) {
        const failed = failedDependency.status === 'failed'
          || failedDependency.status === 'dependency-blocked'
            && failedDependency.terminalFailureCode !== 'cancelled';
        next = updateTask(next, candidate.taskId, (current) => ({
          ...current,
          status: 'dependency-blocked',
          terminalFailureCode: failed ? 'execution-failed' : 'cancelled',
          artifactDigests: []
        }));
        const blockedTask = next.tasks.find((task) => task.taskId === candidate.taskId)!;
        next = appendTaskAudit(next, occurredAt, 'dependency-blocked', blockedTask, {
          reason: failed ? 'upstream-failed' : 'upstream-cancelled',
          dependencyTaskId: failedDependency.taskId
        });
        changed = true;
        continue;
      }
      if (dependencies.every((dependency) => dependency.status === 'succeeded')) {
        next = updateTask(next, candidate.taskId, (current) => ({ ...current, status: 'ready' }));
        const readyTask = next.tasks.find((task) => task.taskId === candidate.taskId)!;
        next = appendTaskAudit(next, occurredAt, 'task-ready', readyTask, {
          dependencyTaskId: terminalTask.taskId
        });
        changed = true;
      }
    }
  }
  return next;
}

function finalizeWorkflowIfTerminal(workflow: DependencyWorkflowState, occurredAt: string) {
  if (workflow.audit.some((event) => event.kind === 'workflow-terminal')) return workflow;
  if (!workflow.tasks.every((task) => TERMINAL_TASK_STATUSES.has(task.status))) return workflow;
  const status: DependencyWorkflowStatus = workflow.tasks.some((task) => task.status === 'failed')
    ? 'failed'
    : workflow.tasks.some((task) => task.status === 'cancelled'
      || task.status === 'dependency-blocked' && task.terminalFailureCode === 'cancelled')
      ? 'cancelled'
      : workflow.tasks.some((task) => task.status === 'dependency-blocked')
        ? 'failed'
        : 'succeeded';
  return appendAudit({ ...workflow, status }, occurredAt, 'workflow-terminal', {
    reason: status === 'failed' ? 'execution-failed' : status === 'cancelled' ? 'cancelled' : undefined
  });
}

function appendTaskAudit(
  workflow: DependencyWorkflowState,
  occurredAt: string,
  kind: DependencyWorkflowAuditKind,
  task: DependencyWorkflowTaskDefinition,
  detail: Partial<DependencyWorkflowAuditEvent> = {}
) {
  return appendAudit(workflow, occurredAt, kind, {
    taskId: task.taskId,
    agentId: task.agentId,
    adapterId: task.adapterId,
    sessionId: task.sessionId,
    runId: task.runId,
    ...detail
  });
}

function appendAudit(
  workflow: DependencyWorkflowState,
  occurredAt: string,
  kind: DependencyWorkflowAuditKind,
  detail: Partial<DependencyWorkflowAuditEvent> = {}
): DependencyWorkflowState {
  const sequence = workflow.audit.length + 1;
  const event: DependencyWorkflowAuditEvent = {
    eventId: `${workflow.workflowId}:audit:${String(sequence).padStart(4, '0')}`,
    sequence,
    occurredAt,
    kind,
    workflowId: workflow.workflowId,
    ...detail
  };
  return { ...workflow, audit: [...workflow.audit, event] };
}

function updateTask(
  workflow: DependencyWorkflowState,
  taskId: string,
  update: (task: DependencyWorkflowTask) => DependencyWorkflowTask
): DependencyWorkflowState {
  return {
    ...workflow,
    tasks: workflow.tasks.map((task) => task.taskId === taskId ? update(task) : task)
  };
}

function mutationIssue(workflow: DependencyWorkflowState, code: string, path: string): DependencyWorkflowMutation {
  return { applied: false, workflow, dispatch: null, issues: [{ code, path }] };
}

function dispatchIntent(workflowId: string, task: DependencyWorkflowTaskDefinition): DependencyDispatchIntent {
  return {
    workflowId,
    taskId: task.taskId,
    agentId: task.agentId,
    adapterId: task.adapterId,
    sessionId: task.sessionId,
    runId: task.runId
  };
}

function hasDependencyCycle(tasks: unknown[]): boolean {
  const graph = new Map<string, string[]>();
  for (const task of tasks) {
    if (isRecord(task) && typeof task.taskId === 'string' && Array.isArray(task.dependsOn)) {
      graph.set(task.taskId, task.dependsOn.filter((dependency): dependency is string => typeof dependency === 'string'));
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (taskId: string): boolean => {
    if (visiting.has(taskId)) return true;
    if (visited.has(taskId)) return false;
    visiting.add(taskId);
    for (const dependency of graph.get(taskId) ?? []) {
      if (graph.has(dependency) && visit(dependency)) return true;
    }
    visiting.delete(taskId);
    visited.add(taskId);
    return false;
  };
  return [...graph.keys()].some(visit);
}

function expectExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: DependencyWorkflowIssue[],
  optional: readonly string[] = []
) {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) issues.push({ code: 'unknown-field', path: `${path}.${key}` });
  }
  for (const key of keys) {
    if (!optional.includes(key) && !(key in value)) issues.push({ code: 'missing-field', path: `${path}.${key}` });
  }
}

function expectExact(
  value: unknown,
  expected: string,
  path: string,
  code: string,
  issues: DependencyWorkflowIssue[]
) {
  if (value !== expected) issues.push({ code, path });
}

function expectId(value: unknown, path: string, issues: DependencyWorkflowIssue[]) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) issues.push({ code: 'identity-invalid', path });
}

function addDuplicate(
  value: unknown,
  seen: Set<string>,
  code: string,
  path: string,
  issues: DependencyWorkflowIssue[]
) {
  if (typeof value !== 'string') return;
  if (seen.has(value)) issues.push({ code, path });
  seen.add(value);
}

function normalizeDigests(digests: string[]) {
  return [...digests].sort();
}

function sameStrings(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function compareTasks(left: Pick<DependencyWorkflowTaskDefinition, 'taskId'>, right: Pick<DependencyWorkflowTaskDefinition, 'taskId'>) {
  return left.taskId.localeCompare(right.taskId, 'en');
}

function pairKey(pair: AvailableAgentAdapterPair) {
  return `${pair.agentId}\u0000${pair.adapterId}`;
}

function uniqueIssues(issues: DependencyWorkflowIssue[]) {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.code}\u0000${issue.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
