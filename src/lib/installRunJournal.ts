export type InstallRunState =
  | 'created'
  | 'running'
  | 'cancelling'
  | 'compensating'
  | 'recovering'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'recovered'
  | 'partial-rollback'
  | 'recovery-failed';

export type InstallRunTerminalState = Extract<
  InstallRunState,
  'succeeded' | 'failed' | 'cancelled' | 'recovered' | 'partial-rollback' | 'recovery-failed'
>;

export type InstallRunStepCancellability = 'cooperative' | 'non-interruptible';

export interface InstallRunCompensation {
  stepId: string;
  effectDigest: string;
}

export interface InstallRunStep {
  stepId: string;
  dependsOn: string[];
  effectDigest: string;
  cancellability: InstallRunStepCancellability;
  rollback:
    | { mode: 'none-required' }
    | { mode: 'compensate'; compensation: InstallRunCompensation };
}

export interface InstallRunBindingInput {
  runId: string;
  planId: string;
  planVersion: string;
  agentId: string;
  consentDigest: string;
  effectDigest: string;
  orderedSteps: InstallRunStep[];
  authorizedCompensationStepIds: string[];
}

export interface InstallRunBinding extends InstallRunBindingInput {
  orderedStepDagDigest: string;
}

export interface InstallRunAuthorization {
  runId: string;
  planId: string;
  planVersion: string;
  agentId: string;
  consentDigest: string;
  effectDigest: string;
}

export interface InstallRunEffectRequest {
  runId: string;
  agentId: string;
  planId: string;
  planVersion: string;
  stepId: string;
  effectDigest: string;
}

export interface InstallRunCompensationRequest extends InstallRunEffectRequest {
  compensationStepId: string;
}

export type InstallRunEffectResult =
  | { status: 'succeeded'; evidenceDigest: string }
  | { status: 'failed' | 'cancelled'; code: string; effectApplied: false }
  | { status: 'failed' | 'cancelled'; code: string; effectApplied: true; evidenceDigest: string };

export type InstallRunCompensationResult =
  | { status: 'succeeded'; evidenceDigest: string }
  | { status: 'failed'; code: string };

export interface InstallRunDependencies {
  hash: (value: string) => string;
  now: () => string;
  executeEffect: (
    request: Readonly<InstallRunEffectRequest>,
    signal: AbortSignal
  ) => InstallRunEffectResult | Promise<InstallRunEffectResult>;
  executeCompensation: (
    request: Readonly<InstallRunCompensationRequest>,
    signal: AbortSignal
  ) => InstallRunCompensationResult | Promise<InstallRunCompensationResult>;
}

export type InstallRunJournalEventKind =
  | 'run-created'
  | 'run-started'
  | 'step-started'
  | 'step-succeeded'
  | 'step-failed'
  | 'step-cancelled'
  | 'cancel-requested'
  | 'compensation-started'
  | 'compensation-succeeded'
  | 'compensation-failed'
  | 'recovery-started'
  | 'run-terminal';

export interface InstallRunJournalEntry {
  sequence: number;
  eventId: string;
  bindingDigest: string;
  previousHash: string | null;
  hash: string;
  at: string;
  kind: InstallRunJournalEventKind;
  fromState: InstallRunState | null;
  toState: InstallRunState;
  stepId: string | null;
  compensationStepId: string | null;
  reason: string | null;
  evidenceDigest: string | null;
  effectApplied: boolean | null;
}

export interface InstallRunLastKnownGood {
  sequence: number;
  entryHash: string;
  completedStepIds: string[];
  compensatedStepIds: string[];
  evidenceDigest: string;
}

export interface InstallRunTerminalOutcome {
  state: InstallRunTerminalState;
  reason: string;
  rollback: 'none' | 'complete' | 'partial';
  sequence: number;
}

export interface InstallRunActiveOperation {
  kind: 'normal' | 'compensation';
  stepId: string;
  compensationStepId: string | null;
}

export interface InstallRunSnapshot {
  schema: 'niuma.install-run-journal';
  schemaVersion: '0.1.0';
  binding: InstallRunBinding;
  bindingDigest: string;
  state: InstallRunState;
  journal: InstallRunJournalEntry[];
  completedStepIds: string[];
  compensatedStepIds: string[];
  activeOperation: InstallRunActiveOperation | null;
  lastKnownGood: InstallRunLastKnownGood | null;
  terminalOutcome: InstallRunTerminalOutcome | null;
}

export interface InstallRunCancelDecision {
  state: InstallRunState;
  idempotent: boolean;
  waitForSafePoint: boolean;
}

export type InstallRunRecoveryResult =
  | { status: 'recovered'; machine: InstallRunJournalMachine }
  | { status: 'recovery-failed'; reason: string; terminalOutcome: InstallRunTerminalOutcome };

interface ReplayState {
  state: InstallRunState | null;
  completedStepIds: string[];
  compensatedStepIds: string[];
  activeOperation: InstallRunActiveOperation | null;
  terminalOutcome: InstallRunTerminalOutcome | null;
}

interface JournalAppendInput {
  kind: InstallRunJournalEventKind;
  toState: InstallRunState;
  stepId?: string;
  compensationStepId?: string;
  reason?: string;
  evidenceDigest?: string;
  effectApplied?: boolean;
}

interface VerificationResult {
  valid: boolean;
  reason: string | null;
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const TERMINAL_STATES = new Set<InstallRunState>([
  'succeeded',
  'failed',
  'cancelled',
  'recovered',
  'partial-rollback',
  'recovery-failed'
]);

export class InstallRunInvariantError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = 'InstallRunInvariantError';
    this.code = code;
  }
}

export function buildInstallRunEffectDigest(
  orderedSteps: readonly InstallRunStep[],
  hash: InstallRunDependencies['hash']
): string {
  return checkedHash(hash, stableStringify(orderedSteps));
}

export function createInstallRun(
  bindingInput: InstallRunBindingInput,
  dependencies: InstallRunDependencies
): InstallRunJournalMachine {
  return InstallRunJournalMachine.create(bindingInput, dependencies);
}

export function verifyInstallRunSnapshot(
  snapshot: InstallRunSnapshot,
  hash: InstallRunDependencies['hash']
): VerificationResult {
  try {
    checkedHash(hash, 'install-run-hash-probe');
    validateSnapshotShape(snapshot);
    validateBinding(snapshot.binding, hash);
    const expectedBindingDigest = bindingDigest(snapshot.binding, hash);
    invariant(snapshot.bindingDigest === expectedBindingDigest, 'binding-digest-mismatch');

    const replay: ReplayState = {
      state: null,
      completedStepIds: [],
      compensatedStepIds: [],
      activeOperation: null,
      terminalOutcome: null
    };
    let previousHash: string | null = null;
    let previousAt = '';
    const stableSequences = new Map<number, ReplayState>();

    snapshot.journal.forEach((entry, index) => {
      invariant(entry.sequence === index + 1, 'journal-sequence-invalid');
      invariant(entry.eventId === `${snapshot.binding.runId}:${entry.sequence}`, 'journal-event-id-invalid');
      invariant(entry.bindingDigest === snapshot.bindingDigest, 'journal-binding-drift');
      invariant(entry.previousHash === previousHash, 'journal-chain-broken');
      invariant(isIsoTimestamp(entry.at), 'journal-time-invalid');
      invariant(previousAt === '' || entry.at >= previousAt, 'journal-time-regressed');
      invariant(entry.hash === hashJournalEntry(entry, hash), 'journal-hash-invalid');
      applyReplayEvent(replay, entry, snapshot.binding);
      if (replay.activeOperation === null) stableSequences.set(entry.sequence, cloneReplay(replay));
      previousHash = entry.hash;
      previousAt = entry.at;
    });

    invariant(snapshot.journal.length > 0, 'journal-empty');
    invariant(replay.state === snapshot.state, 'snapshot-state-mismatch');
    invariant(equalStrings(replay.completedStepIds, snapshot.completedStepIds), 'snapshot-completed-steps-mismatch');
    invariant(equalStrings(replay.compensatedStepIds, snapshot.compensatedStepIds), 'snapshot-compensated-steps-mismatch');
    invariant(equalActive(replay.activeOperation, snapshot.activeOperation), 'snapshot-active-operation-mismatch');
    invariant(equalTerminal(replay.terminalOutcome, snapshot.terminalOutcome), 'snapshot-terminal-outcome-mismatch');

    const lkg = snapshot.lastKnownGood;
    invariant(lkg !== null, 'last-known-good-missing');
    invariant(Number.isInteger(lkg.sequence) && lkg.sequence > 0, 'last-known-good-sequence-invalid');
    const lkgEntry = snapshot.journal[lkg.sequence - 1];
    invariant(lkgEntry?.hash === lkg.entryHash, 'last-known-good-entry-mismatch');
    const lkgReplay = stableSequences.get(lkg.sequence);
    invariant(lkgReplay !== undefined, 'last-known-good-not-stable');
    invariant(equalStrings(lkgReplay.completedStepIds, lkg.completedStepIds), 'last-known-good-completed-mismatch');
    invariant(equalStrings(lkgReplay.compensatedStepIds, lkg.compensatedStepIds), 'last-known-good-compensated-mismatch');
    invariant(lkg.evidenceDigest === lastKnownGoodDigest(lkg, snapshot.bindingDigest, hash), 'last-known-good-digest-invalid');

    const expectedStableSequence = snapshot.activeOperation === null
      ? snapshot.journal.length
      : snapshot.journal.length - 1;
    invariant(lkg.sequence === expectedStableSequence, 'last-known-good-stale');
    return { valid: true, reason: null };
  } catch (error) {
    return { valid: false, reason: errorCode(error) };
  }
}

export async function recoverInstallRun(
  snapshot: InstallRunSnapshot,
  currentAuthorization: InstallRunAuthorization,
  dependencies: InstallRunDependencies
): Promise<InstallRunRecoveryResult> {
  return InstallRunJournalMachine.recover(snapshot, currentAuthorization, dependencies);
}

export class InstallRunJournalMachine {
  private readonly binding: InstallRunBinding;
  private readonly bindingHash: string;
  private readonly dependencies: InstallRunDependencies;
  private stateValue: InstallRunState = 'created';
  private journal: InstallRunJournalEntry[] = [];
  private completedStepIds: string[] = [];
  private compensatedStepIds: string[] = [];
  private activeOperation: InstallRunActiveOperation | null = null;
  private lastKnownGood: InstallRunLastKnownGood | null = null;
  private terminalOutcome: InstallRunTerminalOutcome | null = null;
  private activeAbortController: AbortController | null = null;
  private compensationPromise: Promise<void> | null = null;

  private constructor(binding: InstallRunBinding, bindingHash: string, dependencies: InstallRunDependencies) {
    this.binding = clone(binding);
    this.bindingHash = bindingHash;
    this.dependencies = dependencies;
  }

  static create(
    bindingInput: InstallRunBindingInput,
    dependencies: InstallRunDependencies
  ): InstallRunJournalMachine {
    validateDependencies(dependencies);
    const binding = normalizeBinding(bindingInput, dependencies.hash);
    const machine = new InstallRunJournalMachine(binding, bindingDigest(binding, dependencies.hash), dependencies);
    machine.initialize();
    return machine;
  }

  private static restore(snapshot: InstallRunSnapshot, dependencies: InstallRunDependencies): InstallRunJournalMachine {
    const machine = new InstallRunJournalMachine(snapshot.binding, snapshot.bindingDigest, dependencies);
    machine.stateValue = snapshot.state;
    machine.journal = clone(snapshot.journal);
    machine.completedStepIds = [...snapshot.completedStepIds];
    machine.compensatedStepIds = [...snapshot.compensatedStepIds];
    machine.activeOperation = clone(snapshot.activeOperation);
    machine.lastKnownGood = clone(snapshot.lastKnownGood);
    machine.terminalOutcome = clone(snapshot.terminalOutcome);
    return machine;
  }

  static async recover(
    snapshot: InstallRunSnapshot,
    currentAuthorization: InstallRunAuthorization,
    dependencies: InstallRunDependencies
  ): Promise<InstallRunRecoveryResult> {
    try {
      validateDependencies(dependencies);
      const verification = verifyInstallRunSnapshot(snapshot, dependencies.hash);
      invariant(verification.valid, verification.reason ?? 'journal-invalid');
      assertAuthorization(snapshot.binding, currentAuthorization);
      invariant(snapshot.terminalOutcome === null, 'terminal-outcome-exists');
      invariant(snapshot.activeOperation === null, 'unknown-active-effect');
      invariant(
        snapshot.state === 'created'
          || snapshot.state === 'running'
          || snapshot.state === 'cancelling'
          || snapshot.state === 'compensating'
          || snapshot.state === 'recovering',
        'recovery-state-impossible'
      );

      const machine = InstallRunJournalMachine.restore(snapshot, dependencies);
      machine.append({ kind: 'recovery-started', toState: 'recovering', reason: 'interruption-recovery' });
      await machine.compensate('recovery');
      return { status: 'recovered', machine };
    } catch (error) {
      const reason = errorCode(error);
      return {
        status: 'recovery-failed',
        reason,
        terminalOutcome: { state: 'recovery-failed', reason, rollback: 'none', sequence: 1 }
      };
    }
  }

  initialize(): void {
    invariant(this.journal.length === 0, 'run-already-initialized');
    this.append({ kind: 'run-created', toState: 'created', reason: 'binding-sealed' }, null);
  }

  get state(): InstallRunState {
    return this.stateValue;
  }

  get terminal(): InstallRunTerminalOutcome | null {
    return clone(this.terminalOutcome);
  }

  snapshot(): InstallRunSnapshot {
    return clone({
      schema: 'niuma.install-run-journal' as const,
      schemaVersion: '0.1.0' as const,
      binding: this.binding,
      bindingDigest: this.bindingHash,
      state: this.stateValue,
      journal: this.journal,
      completedStepIds: this.completedStepIds,
      compensatedStepIds: this.compensatedStepIds,
      activeOperation: this.activeOperation,
      lastKnownGood: this.lastKnownGood,
      terminalOutcome: this.terminalOutcome
    });
  }

  start(authorization: InstallRunAuthorization): void {
    this.assertMutable('created');
    assertAuthorization(this.binding, authorization);
    this.append({ kind: 'run-started', toState: 'running', reason: 'authorization-current' });
  }

  async advance(authorization: InstallRunAuthorization): Promise<InstallRunSnapshot> {
    assertAuthorization(this.binding, authorization);
    this.assertMutable('running');
    invariant(this.activeOperation === null, 'effect-in-progress');
    const step = this.binding.orderedSteps.find((candidate) => !this.completedStepIds.includes(candidate.stepId));
    if (!step) {
      this.writeTerminal('succeeded', 'all-steps-succeeded', 'none');
      return this.snapshot();
    }
    invariant(step.dependsOn.every((dependency) => this.completedStepIds.includes(dependency)), 'step-dependency-unsatisfied');

    this.activeOperation = { kind: 'normal', stepId: step.stepId, compensationStepId: null };
    this.activeAbortController = new AbortController();
    this.append({ kind: 'step-started', toState: 'running', stepId: step.stepId, reason: 'ordered-step-ready' });

    let result: InstallRunEffectResult;
    try {
      result = await this.dependencies.executeEffect(
        Object.freeze({
          runId: this.binding.runId,
          agentId: this.binding.agentId,
          planId: this.binding.planId,
          planVersion: this.binding.planVersion,
          stepId: step.stepId,
          effectDigest: step.effectDigest
        }),
        this.activeAbortController.signal
      );
      validateEffectResult(result);
    } catch {
      result = { status: 'failed', code: 'effect-executor-threw', effectApplied: false };
    }

    this.activeAbortController = null;
    const stateAtSafePoint = this.stateValue;
    invariant(stateAtSafePoint === 'running' || stateAtSafePoint === 'cancelling', 'effect-result-state-impossible');
    this.activeOperation = null;

    if (result.status === 'succeeded') {
      this.completedStepIds.push(step.stepId);
      this.append({
        kind: 'step-succeeded',
        toState: stateAtSafePoint,
        stepId: step.stepId,
        reason: 'effect-evidence-recorded',
        evidenceDigest: result.evidenceDigest,
        effectApplied: true
      });
    } else {
      if (result.effectApplied) this.completedStepIds.push(step.stepId);
      this.append({
        kind: result.status === 'cancelled' ? 'step-cancelled' : 'step-failed',
        toState: stateAtSafePoint === 'cancelling' ? 'cancelling' : 'compensating',
        stepId: step.stepId,
        reason: result.code,
        evidenceDigest: result.effectApplied ? result.evidenceDigest : undefined,
        effectApplied: result.effectApplied
      });
    }

    if (stateAtSafePoint === 'cancelling') {
      await this.compensate('cancel');
    } else if (result.status !== 'succeeded') {
      await this.compensate('failure');
    } else if (this.completedStepIds.length === this.binding.orderedSteps.length) {
      this.writeTerminal('succeeded', 'all-steps-succeeded', 'none');
    }
    return this.snapshot();
  }

  async requestCancel(): Promise<InstallRunCancelDecision> {
    if (this.stateValue === 'cancelled') {
      return { state: 'cancelled', idempotent: true, waitForSafePoint: false };
    }
    if (this.stateValue === 'cancelling' || this.stateValue === 'compensating') {
      return {
        state: this.stateValue,
        idempotent: true,
        waitForSafePoint: this.activeOperation?.kind === 'normal'
      };
    }
    invariant(!this.terminalOutcome, 'terminal-outcome-exists');
    invariant(this.stateValue === 'created' || this.stateValue === 'running', 'cancel-state-impossible');

    if (this.stateValue === 'created') {
      this.writeTerminal('cancelled', 'cancelled-before-start', 'none');
      return { state: 'cancelled', idempotent: false, waitForSafePoint: false };
    }

    this.append({ kind: 'cancel-requested', toState: 'cancelling', reason: 'user-cancelled' });
    const activeStep = this.activeOperation?.kind === 'normal'
      ? this.binding.orderedSteps.find((step) => step.stepId === this.activeOperation?.stepId)
      : null;
    const waitForSafePoint = activeStep !== null && activeStep !== undefined;
    if (activeStep?.cancellability === 'cooperative') this.activeAbortController?.abort();
    if (!waitForSafePoint) await this.compensate('cancel');
    return { state: this.stateValue, idempotent: false, waitForSafePoint };
  }

  private assertMutable(expectedState: InstallRunState): void {
    invariant(!this.terminalOutcome, 'terminal-outcome-exists');
    invariant(this.stateValue === expectedState, 'impossible-transition');
  }

  private async compensate(trigger: 'cancel' | 'failure' | 'recovery'): Promise<void> {
    if (this.compensationPromise) return this.compensationPromise;
    this.compensationPromise = this.runCompensation(trigger);
    try {
      await this.compensationPromise;
    } finally {
      this.compensationPromise = null;
    }
  }

  private async runCompensation(trigger: 'cancel' | 'failure' | 'recovery'): Promise<void> {
    const compensatable = [...this.completedStepIds]
      .reverse()
      .map((stepId) => this.binding.orderedSteps.find((step) => step.stepId === stepId))
      .filter((step): step is InstallRunStep => step?.rollback.mode === 'compensate')
      .filter((step) => !this.compensatedStepIds.includes(step.stepId));

    for (const step of compensatable) {
      invariant(step.rollback.mode === 'compensate', 'unsafe-compensation');
      const compensation = step.rollback.compensation;
      invariant(this.binding.authorizedCompensationStepIds.includes(compensation.stepId), 'unsafe-compensation');
      this.activeOperation = {
        kind: 'compensation',
        stepId: step.stepId,
        compensationStepId: compensation.stepId
      };
      this.activeAbortController = new AbortController();
      this.append({
        kind: 'compensation-started',
        toState: 'compensating',
        stepId: step.stepId,
        compensationStepId: compensation.stepId,
        reason: trigger
      });

      let result: InstallRunCompensationResult;
      try {
        result = await this.dependencies.executeCompensation(
          Object.freeze({
            runId: this.binding.runId,
            agentId: this.binding.agentId,
            planId: this.binding.planId,
            planVersion: this.binding.planVersion,
            stepId: step.stepId,
            effectDigest: compensation.effectDigest,
            compensationStepId: compensation.stepId
          }),
          this.activeAbortController.signal
        );
        validateCompensationResult(result);
      } catch {
        result = { status: 'failed', code: 'compensation-executor-threw' };
      }
      this.activeAbortController = null;
      this.activeOperation = null;

      if (result.status === 'failed') {
        this.append({
          kind: 'compensation-failed',
          toState: 'compensating',
          stepId: step.stepId,
          compensationStepId: compensation.stepId,
          reason: result.code
        });
        this.writeTerminal('partial-rollback', result.code, 'partial');
        return;
      }
      this.compensatedStepIds.push(step.stepId);
      this.append({
        kind: 'compensation-succeeded',
        toState: 'compensating',
        stepId: step.stepId,
        compensationStepId: compensation.stepId,
        reason: trigger,
        evidenceDigest: result.evidenceDigest,
        effectApplied: true
      });
    }

    const rollback = this.compensatedStepIds.length > 0 ? 'complete' : 'none';
    if (trigger === 'cancel') this.writeTerminal('cancelled', 'cancelled-at-safe-point', rollback);
    else if (trigger === 'failure') this.writeTerminal('failed', 'effect-failed', rollback);
    else this.writeTerminal('recovered', 'interruption-rollback-complete', rollback);
  }

  private writeTerminal(state: InstallRunTerminalState, reason: string, rollback: InstallRunTerminalOutcome['rollback']): void {
    invariant(this.terminalOutcome === null, 'duplicate-terminal-write');
    invariant(TERMINAL_STATES.has(state), 'terminal-state-invalid');
    const sequence = this.journal.length + 1;
    this.append({ kind: 'run-terminal', toState: state, reason });
    this.terminalOutcome = { state, reason, rollback, sequence };
  }

  private append(input: JournalAppendInput, forcedFromState?: InstallRunState | null): void {
    const fromState = forcedFromState === undefined ? this.stateValue : forcedFromState;
    const sequence = this.journal.length + 1;
    const at = this.dependencies.now();
    invariant(isIsoTimestamp(at), 'journal-time-invalid');
    invariant(this.journal.length === 0 || at >= this.journal[this.journal.length - 1].at, 'journal-time-regressed');
    const entryWithoutHash = {
      sequence,
      eventId: `${this.binding.runId}:${sequence}`,
      bindingDigest: this.bindingHash,
      previousHash: this.journal.at(-1)?.hash ?? null,
      at,
      kind: input.kind,
      fromState,
      toState: input.toState,
      stepId: input.stepId ?? null,
      compensationStepId: input.compensationStepId ?? null,
      reason: input.reason ?? null,
      evidenceDigest: input.evidenceDigest ?? null,
      effectApplied: input.effectApplied ?? null
    };
    const entry: InstallRunJournalEntry = {
      ...entryWithoutHash,
      hash: checkedHash(this.dependencies.hash, stableStringify(entryWithoutHash))
    };
    this.journal.push(entry);
    this.stateValue = input.toState;
    if (this.activeOperation === null) this.captureLastKnownGood(entry);
  }

  private captureLastKnownGood(entry: InstallRunJournalEntry): void {
    const base = {
      sequence: entry.sequence,
      entryHash: entry.hash,
      completedStepIds: [...this.completedStepIds],
      compensatedStepIds: [...this.compensatedStepIds]
    };
    this.lastKnownGood = {
      ...base,
      evidenceDigest: checkedHash(this.dependencies.hash, stableStringify({ ...base, bindingDigest: this.bindingHash }))
    };
  }
}

function normalizeBinding(input: InstallRunBindingInput, hash: InstallRunDependencies['hash']): InstallRunBinding {
  const binding: InstallRunBinding = {
    ...clone(input),
    orderedStepDagDigest: checkedHash(hash, stableStringify(input.orderedSteps.map(({ stepId, dependsOn }) => ({ stepId, dependsOn }))))
  };
  validateBinding(binding, hash);
  return binding;
}

function validateBinding(binding: InstallRunBinding, hash: InstallRunDependencies['hash']): void {
  for (const value of [binding.runId, binding.planId, binding.planVersion, binding.agentId]) {
    invariant(isNonEmptyString(value), 'binding-identity-invalid');
  }
  invariant(isDigest(binding.consentDigest), 'consent-digest-invalid');
  invariant(isDigest(binding.effectDigest), 'effect-digest-invalid');
  invariant(Array.isArray(binding.orderedSteps) && binding.orderedSteps.length > 0, 'ordered-step-dag-empty');
  invariant(Array.isArray(binding.authorizedCompensationStepIds), 'authorized-compensations-invalid');
  invariant(new Set(binding.authorizedCompensationStepIds).size === binding.authorizedCompensationStepIds.length, 'authorized-compensation-duplicate');
  invariant(binding.authorizedCompensationStepIds.every(isNonEmptyString), 'authorized-compensation-id-invalid');

  const seen = new Set<string>();
  const compensationIds = new Set<string>();
  for (const step of binding.orderedSteps) {
    invariant(isNonEmptyString(step.stepId) && !seen.has(step.stepId), 'step-id-invalid');
    invariant(Array.isArray(step.dependsOn) && new Set(step.dependsOn).size === step.dependsOn.length, 'step-dependencies-invalid');
    invariant(step.dependsOn.every((dependency) => seen.has(dependency)), 'ordered-step-dag-invalid');
    invariant(isDigest(step.effectDigest), 'step-effect-digest-invalid');
    invariant(step.cancellability === 'cooperative' || step.cancellability === 'non-interruptible', 'step-cancellability-invalid');
    invariant(step.rollback?.mode === 'none-required' || step.rollback?.mode === 'compensate', 'step-rollback-invalid');
    if (step.rollback.mode === 'compensate') {
      const compensation = step.rollback.compensation;
      invariant(isNonEmptyString(compensation?.stepId) && isDigest(compensation?.effectDigest), 'unsafe-compensation');
      invariant(!seen.has(compensation.stepId) && !compensationIds.has(compensation.stepId), 'compensation-id-conflict');
      invariant(binding.authorizedCompensationStepIds.includes(compensation.stepId), 'unsafe-compensation');
      compensationIds.add(compensation.stepId);
    }
    seen.add(step.stepId);
  }
  invariant(
    binding.authorizedCompensationStepIds.every((stepId) => compensationIds.has(stepId)),
    'unknown-authorized-compensation'
  );
  invariant(binding.effectDigest === buildInstallRunEffectDigest(binding.orderedSteps, hash), 'effect-digest-binding-mismatch');
  const expectedDagDigest = checkedHash(hash, stableStringify(binding.orderedSteps.map(({ stepId, dependsOn }) => ({ stepId, dependsOn }))));
  invariant(binding.orderedStepDagDigest === expectedDagDigest, 'ordered-step-dag-digest-mismatch');
}

function bindingDigest(binding: InstallRunBinding, hash: InstallRunDependencies['hash']): string {
  return checkedHash(hash, stableStringify(binding));
}

function assertAuthorization(binding: InstallRunBinding, authorization: InstallRunAuthorization): void {
  invariant(authorization.runId === binding.runId, 'authorization-run-drift');
  invariant(authorization.planId === binding.planId, 'authorization-plan-drift');
  invariant(authorization.planVersion === binding.planVersion, 'authorization-plan-version-drift');
  invariant(authorization.agentId === binding.agentId, 'authorization-agent-drift');
  invariant(authorization.consentDigest === binding.consentDigest, 'authorization-consent-drift');
  invariant(authorization.effectDigest === binding.effectDigest, 'authorization-effect-drift');
}

function applyReplayEvent(replay: ReplayState, entry: InstallRunJournalEntry, binding: InstallRunBinding): void {
  invariant(entry.fromState === replay.state, 'journal-from-state-invalid');
  const step = entry.stepId ? binding.orderedSteps.find((candidate) => candidate.stepId === entry.stepId) : undefined;
  switch (entry.kind) {
    case 'run-created':
      invariant(entry.sequence === 1 && replay.state === null && entry.toState === 'created', 'impossible-transition');
      break;
    case 'run-started':
      invariant(replay.state === 'created' && entry.toState === 'running' && replay.activeOperation === null, 'impossible-transition');
      break;
    case 'step-started':
      invariant(replay.state === 'running' && entry.toState === 'running' && step !== undefined, 'impossible-transition');
      invariant(replay.activeOperation === null && !replay.completedStepIds.includes(step.stepId), 'step-start-invalid');
      invariant(step.dependsOn.every((dependency) => replay.completedStepIds.includes(dependency)), 'step-dependency-unsatisfied');
      replay.activeOperation = { kind: 'normal', stepId: step.stepId, compensationStepId: null };
      break;
    case 'cancel-requested':
      invariant(replay.state === 'running' && entry.toState === 'cancelling', 'impossible-transition');
      break;
    case 'step-succeeded':
    case 'step-failed':
    case 'step-cancelled': {
      invariant(step !== undefined && replay.activeOperation?.kind === 'normal' && replay.activeOperation.stepId === step.stepId, 'step-result-without-start');
      invariant(replay.state === 'running' || replay.state === 'cancelling', 'impossible-transition');
      const expectedState = replay.state === 'cancelling'
        ? 'cancelling'
        : entry.kind === 'step-succeeded' ? 'running' : 'compensating';
      invariant(entry.toState === expectedState, 'impossible-transition');
      const applied = entry.kind === 'step-succeeded' || entry.effectApplied === true;
      if (applied) {
        invariant(isDigest(entry.evidenceDigest), 'effect-evidence-invalid');
        invariant(!replay.completedStepIds.includes(step.stepId), 'step-completion-duplicate');
        replay.completedStepIds.push(step.stepId);
      }
      replay.activeOperation = null;
      break;
    }
    case 'compensation-started': {
      invariant(step?.rollback.mode === 'compensate', 'unsafe-compensation');
      invariant(replay.state === 'cancelling' || replay.state === 'compensating' || replay.state === 'recovering', 'impossible-transition');
      invariant(entry.toState === 'compensating' && replay.activeOperation === null, 'impossible-transition');
      invariant(entry.compensationStepId === step.rollback.compensation.stepId, 'unauthorized-compensation');
      const expected = [...replay.completedStepIds]
        .reverse()
        .map((stepId) => binding.orderedSteps.find((candidate) => candidate.stepId === stepId))
        .find((candidate) => candidate?.rollback.mode === 'compensate' && !replay.compensatedStepIds.includes(candidate.stepId));
      invariant(expected?.stepId === step.stepId, 'compensation-order-invalid');
      replay.activeOperation = { kind: 'compensation', stepId: step.stepId, compensationStepId: entry.compensationStepId };
      break;
    }
    case 'compensation-succeeded':
    case 'compensation-failed':
      invariant(replay.state === 'compensating' && entry.toState === 'compensating', 'impossible-transition');
      invariant(replay.activeOperation?.kind === 'compensation' && replay.activeOperation.stepId === entry.stepId, 'compensation-result-without-start');
      if (entry.kind === 'compensation-succeeded') {
        invariant(isDigest(entry.evidenceDigest), 'compensation-evidence-invalid');
        replay.compensatedStepIds.push(replay.activeOperation.stepId);
      }
      replay.activeOperation = null;
      break;
    case 'recovery-started':
      invariant(
        replay.activeOperation === null
          && (replay.state === 'created'
            || replay.state === 'running'
            || replay.state === 'cancelling'
            || replay.state === 'compensating'
            || replay.state === 'recovering')
          && entry.toState === 'recovering',
        'impossible-transition'
      );
      break;
    case 'run-terminal':
      invariant(replay.terminalOutcome === null && TERMINAL_STATES.has(entry.toState), 'duplicate-terminal-write');
      invariant(terminalTransitionAllowed(replay.state, entry.toState), 'impossible-transition');
      replay.terminalOutcome = {
        state: entry.toState as InstallRunTerminalState,
        reason: entry.reason ?? 'terminal-reason-missing',
        rollback: entry.toState === 'partial-rollback'
          ? 'partial'
          : replay.compensatedStepIds.length > 0 ? 'complete' : 'none',
        sequence: entry.sequence
      };
      break;
    default:
      throw new InstallRunInvariantError('journal-event-kind-invalid');
  }
  replay.state = entry.toState;
}

function terminalTransitionAllowed(from: InstallRunState | null, to: InstallRunState): boolean {
  if (from === 'created') return to === 'cancelled';
  if (from === 'running') return to === 'succeeded';
  if (from === 'cancelling') return to === 'cancelled';
  if (from === 'compensating') return to === 'failed' || to === 'cancelled' || to === 'recovered' || to === 'partial-rollback';
  if (from === 'recovering') return to === 'recovered';
  return false;
}

function validateSnapshotShape(snapshot: InstallRunSnapshot): void {
  invariant(snapshot?.schema === 'niuma.install-run-journal' && snapshot.schemaVersion === '0.1.0', 'journal-schema-invalid');
  invariant(Array.isArray(snapshot.journal), 'journal-invalid');
  invariant(Array.isArray(snapshot.completedStepIds) && Array.isArray(snapshot.compensatedStepIds), 'snapshot-step-state-invalid');
}

function validateDependencies(dependencies: InstallRunDependencies): void {
  invariant(typeof dependencies?.hash === 'function', 'hash-dependency-missing');
  invariant(typeof dependencies?.now === 'function', 'clock-dependency-missing');
  invariant(typeof dependencies?.executeEffect === 'function', 'effect-dependency-missing');
  invariant(typeof dependencies?.executeCompensation === 'function', 'compensation-dependency-missing');
  checkedHash(dependencies.hash, 'install-run-hash-probe');
}

function validateEffectResult(result: InstallRunEffectResult): void {
  invariant(result?.status === 'succeeded' || result?.status === 'failed' || result?.status === 'cancelled', 'effect-result-invalid');
  if (result.status === 'succeeded') invariant(isDigest(result.evidenceDigest), 'effect-evidence-invalid');
  else {
    invariant(isNonEmptyString(result.code) && typeof result.effectApplied === 'boolean', 'effect-result-invalid');
    if (result.effectApplied) invariant(isDigest(result.evidenceDigest), 'effect-evidence-invalid');
  }
}

function validateCompensationResult(result: InstallRunCompensationResult): void {
  invariant(result?.status === 'succeeded' || result?.status === 'failed', 'compensation-result-invalid');
  if (result.status === 'succeeded') invariant(isDigest(result.evidenceDigest), 'compensation-evidence-invalid');
  else invariant(isNonEmptyString(result.code), 'compensation-result-invalid');
}

function hashJournalEntry(entry: InstallRunJournalEntry, hash: InstallRunDependencies['hash']): string {
  const { hash: _hash, ...entryWithoutHash } = entry;
  return checkedHash(hash, stableStringify(entryWithoutHash));
}

function lastKnownGoodDigest(
  lkg: Omit<InstallRunLastKnownGood, 'evidenceDigest'> | InstallRunLastKnownGood,
  bindingHash: string,
  hash: InstallRunDependencies['hash']
): string {
  const { evidenceDigest: _digest, ...base } = lkg as InstallRunLastKnownGood;
  return checkedHash(hash, stableStringify({ ...base, bindingDigest: bindingHash }));
}

function checkedHash(hash: InstallRunDependencies['hash'], value: string): string {
  const digest = hash(value);
  invariant(isDigest(digest), 'hash-result-invalid');
  return digest;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

function clone<T>(value: T): T {
  return value === undefined ? value : structuredClone(value);
}

function cloneReplay(value: ReplayState): ReplayState {
  return clone(value);
}

function equalStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function equalActive(left: InstallRunActiveOperation | null, right: InstallRunActiveOperation | null): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function equalTerminal(left: InstallRunTerminalOutcome | null, right: InstallRunTerminalOutcome | null): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isDigest(value: unknown): value is string {
  return typeof value === 'string' && SHA256_PATTERN.test(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function invariant(condition: unknown, code: string): asserts condition {
  if (!condition) throw new InstallRunInvariantError(code);
}

function errorCode(error: unknown): string {
  return error instanceof InstallRunInvariantError ? error.code : 'install-run-invariant-failed';
}
