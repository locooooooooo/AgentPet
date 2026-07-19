import type {
  AgentHostDiscoverySnapshot,
  AgentHostLifecycleFact,
  AgentHostVersionEvidence,
  CodexHostSnapshot,
  ConnectorConfig,
  ConnectorGateResult
} from '../types';
import type { AgentTruthProjection } from './agentInstanceProjection';

export type AgentLibrarySupportLevel =
  | 'catalogued'
  | 'detected'
  | 'installed'
  | 'launchable'
  | 'connectable'
  | 'coordinatable';

export type AgentLibraryEvidenceState = 'yes' | 'no' | 'unknown';
export type AgentLibraryConnectorState = 'unregistered' | 'blocked' | 'pending' | 'ready' | 'online' | 'unknown';

export interface AgentLibraryManifest {
  agentId: string;
  connectorId: string;
  displayName: string;
  lifecycleManaged: boolean;
  catalogSource: string;
}

export interface AgentLibraryEvidence<T> {
  value: T;
  source: string;
  observedAt: string;
}

export interface AgentLibraryEntry {
  agentId: string;
  connectorId: string;
  displayName: string;
  catalogued: boolean;
  lifecycleManaged: boolean;
  supportLevel: AgentLibrarySupportLevel;
  support: AgentLibraryEvidence<AgentLibrarySupportLevel>;
  version: AgentLibraryEvidence<string | null>;
  installed: AgentLibraryEvidence<AgentLibraryEvidenceState>;
  running: AgentLibraryEvidence<AgentLibraryEvidenceState>;
  lifecycleState: AgentLibraryEvidence<string>;
  connector: AgentLibraryEvidence<AgentLibraryConnectorState>;
  action?: AgentLibraryEvidence<string>;
  boundAgent: AgentLibraryEvidence<boolean>;
  sources: string[];
}

export interface AgentLibraryProjectionInput {
  hostDiscovery: AgentHostDiscoverySnapshot;
  agentTruth: AgentTruthProjection;
  codexHost: CodexHostSnapshot;
  connectors: readonly Pick<ConnectorConfig, 'id' | 'status' | 'approvalStatus' | 'enabledByDefault'>[];
  gateResults?: Readonly<Record<string, ConnectorGateResult | undefined>>;
  now?: string | number | Date;
  manifests?: readonly AgentLibraryManifest[];
}

export const AGENT_LIBRARY_MANIFESTS: readonly AgentLibraryManifest[] = Object.freeze([
  { agentId: 'codex', connectorId: 'codex', displayName: 'Codex', lifecycleManaged: false, catalogSource: 'manifest-registry' },
  { agentId: 'trae', connectorId: 'trae', displayName: 'Trae', lifecycleManaged: true, catalogSource: 'manifest-registry' },
  { agentId: 'workbuddy', connectorId: 'workbuddy', displayName: 'WorkBuddy', lifecycleManaged: true, catalogSource: 'manifest-registry' },
  { agentId: 'qoder', connectorId: 'qoder', displayName: 'Qoder', lifecycleManaged: true, catalogSource: 'manifest-registry' },
  { agentId: 'minimax', connectorId: 'minimax', displayName: 'MiniMax', lifecycleManaged: true, catalogSource: 'manifest-registry' },
  { agentId: 'openclaw', connectorId: 'openclaw', displayName: 'OpenClaw', lifecycleManaged: true, catalogSource: 'manifest-registry' }
]);

export function projectAgentLibrary(input: AgentLibraryProjectionInput): AgentLibraryEntry[] {
  const now = normalizeDate(input.now ?? input.agentTruth.projectedAt);
  const manifests = input.manifests ?? AGENT_LIBRARY_MANIFESTS;
  const lifecycleByAgent = new Map(input.hostDiscovery.lifecycle.map((fact) => [fact.agentId, fact]));
  const connectorById = new Map(input.connectors.map((connector) => [connector.id, connector]));
  const entries = manifests.map((manifest) => projectManifestEntry({
    manifest,
    lifecycle: lifecycleByAgent.get(manifest.agentId),
    input,
    connector: connectorById.get(manifest.connectorId),
    now
  }));
  const cataloguedIds = new Set(manifests.map((manifest) => manifest.agentId));
  const orphanEntries = input.hostDiscovery.facts
    .filter((fact) => !cataloguedIds.has(fact.agentId))
    .map((fact) => projectOrphanEntry(fact, input, now));
  return [...entries, ...orphanEntries].sort((left, right) => (
    left.displayName.localeCompare(right.displayName, 'en-US')
    || left.agentId.localeCompare(right.agentId, 'en-US')
  ));
}

function projectManifestEntry(context: {
  manifest: AgentLibraryManifest;
  lifecycle?: AgentHostLifecycleFact;
  input: AgentLibraryProjectionInput;
  connector?: Pick<ConnectorConfig, 'id' | 'status' | 'approvalStatus' | 'enabledByDefault'>;
  now: string;
}): AgentLibraryEntry {
  const {
    manifest,
    lifecycle,
    input: projectionInput,
    connector: connectorPolicy,
    now
  } = context;
  const lifecycleObservedAt = lifecycle?.observedAt ?? projectionInput.hostDiscovery.observedAt ?? now;
  const isCodexRunning = manifest.agentId === 'codex' && projectionInput.codexHost.clientRunning;
  const hasCodexObservation = manifest.agentId === 'codex' && projectionInput.codexHost.availability === 'available';
  const installed: AgentLibraryEvidenceState = lifecycle
    ? (lifecycle.installed ? 'yes' : 'no')
    : isCodexRunning
      ? 'yes'
      : hasCodexObservation
        ? 'unknown'
        : 'unknown';
  const running: AgentLibraryEvidenceState = lifecycle
    ? (lifecycle.running ? 'yes' : 'no')
    : manifest.agentId === 'codex'
      ? (hasCodexObservation ? (isCodexRunning ? 'yes' : 'no') : 'unknown')
      : 'unknown';
  const detected = Boolean(lifecycle && (lifecycle.installed || lifecycle.running)) || isCodexRunning;
  const launchable = Boolean(lifecycle?.installed && lifecycle.primaryAction && lifecycle.primaryAction !== 'install');
  const boundAgent = projectionInput.agentTruth.agents.some((agent) => (
    agent.agentId === manifest.agentId && agent.connectorId === manifest.connectorId && agent.configured
  ));
  const connectorEvidence = projectConnectorEvidence({
    connector: connectorPolicy,
    gate: projectionInput.gateResults?.[manifest.connectorId],
    truth: projectionInput.agentTruth.agents.find((agent) => (
      agent.agentId === manifest.agentId && agent.connectorId === manifest.connectorId
    )),
    observedAt: projectionInput.agentTruth.projectedAt
  });
  const supportLevel = highestSupportLevel({
    detected,
    installed: installed === 'yes',
    launchable,
    connector: connectorEvidence.value
  });
  const sourceSet = new Set([manifest.catalogSource]);
  if (lifecycle) {
    sourceSet.add('windows-app-registration');
  }
  if (hasCodexObservation) {
    sourceSet.add(projectionInput.codexHost.source);
  }
  if (connectorEvidence.source) {
    sourceSet.add(connectorEvidence.source);
  }
  return {
    agentId: manifest.agentId,
    connectorId: manifest.connectorId,
    displayName: manifest.displayName,
    catalogued: true,
    lifecycleManaged: manifest.lifecycleManaged,
    supportLevel,
    support: evidence(
      supportLevel,
      supportSource(supportLevel, manifest, lifecycle, connectorEvidence),
      lifecycleObservedAt
    ),
    version: projectVersionEvidence(lifecycle?.version, lifecycleObservedAt),
    installed: evidence(
      installed,
      lifecycle ? 'windows-app-registration' : hasCodexObservation ? projectionInput.codexHost.source : 'not-observed',
      lifecycleObservedAt
    ),
    running: evidence(
      running,
      lifecycle ? 'windows-process-list' : hasCodexObservation ? projectionInput.codexHost.source : 'not-observed',
      lifecycleObservedAt
    ),
    lifecycleState: evidence(
      lifecycle?.state ?? (manifest.agentId === 'codex' && isCodexRunning ? 'working' : 'unknown'),
      lifecycle ? 'windows-lifecycle-probe' : hasCodexObservation ? projectionInput.codexHost.source : 'not-observed',
      lifecycleObservedAt
    ),
    connector: connectorEvidence,
    ...(lifecycle?.primaryAction
      ? { action: evidence(lifecycle.primaryAction, 'windows-lifecycle-probe', lifecycleObservedAt) }
      : {}),
    boundAgent: evidence(boundAgent, 'agent-snapshot-registry', projectionInput.agentTruth.projectedAt),
    sources: [...sourceSet]
  };
}

function projectOrphanEntry(
  fact: AgentLibraryProjectionInput['hostDiscovery']['facts'][number],
  input: AgentLibraryProjectionInput,
  now: string
): AgentLibraryEntry {
  const truth = input.agentTruth.agents.find((agent) => agent.agentId === fact.agentId && agent.connectorId === fact.connectorId);
  const observedAt = fact.observedAt || input.hostDiscovery.observedAt || now;
  const detected = fact.running && fact.processCount > 0;
  const supportLevel: AgentLibrarySupportLevel = detected ? 'detected' : 'catalogued';
  const sourceSet = ['windows-process-list', 'unbound-host-discovery'];
  if (truth?.configured) {
    sourceSet.push('agent-snapshot-registry');
  }
  return {
    agentId: fact.agentId,
    connectorId: fact.connectorId,
    displayName: fact.displayName,
    catalogued: false,
    lifecycleManaged: false,
    supportLevel,
    support: evidence(supportLevel, 'windows-process-list', observedAt),
    version: projectVersionEvidence(fact.version, observedAt),
    installed: evidence('unknown', 'process-presence-does-not-prove-installed', observedAt),
    running: evidence(detected ? 'yes' : 'unknown', 'windows-process-list', observedAt),
    lifecycleState: evidence(detected ? 'detected' : 'unknown', 'windows-process-list', observedAt),
    connector: evidence('unregistered', 'connector-policy', input.hostDiscovery.observedAt),
    boundAgent: evidence(Boolean(truth?.configured), 'agent-snapshot-registry', input.agentTruth.projectedAt),
    sources: sourceSet
  };
}

function projectConnectorEvidence(input: {
  connector?: Pick<ConnectorConfig, 'id' | 'status' | 'approvalStatus' | 'enabledByDefault'>;
  gate?: ConnectorGateResult;
  truth?: AgentTruthProjection['agents'][number];
  observedAt: string;
}): AgentLibraryEvidence<AgentLibraryConnectorState> {
  if (!input.connector) {
    return evidence('unregistered', 'connector-policy', input.observedAt);
  }
  if (input.connector.approvalStatus === 'rejected' || input.connector.status === 'disabled') {
    return evidence('blocked', 'connector-policy', input.observedAt);
  }
  if (!input.gate) {
    return evidence('pending', 'connector-gate', input.observedAt);
  }
  if (!input.gate.executable || input.connector.approvalStatus !== 'accepted' || !input.connector.enabledByDefault) {
    return evidence('blocked', 'connector-gate', input.observedAt);
  }
  const primary = input.truth?.primaryInstance;
  const observedCapabilities = primary?.capabilities?.length && primary.capabilitySource === 'runtime-observed';
  if (input.truth?.isOnline && observedCapabilities) {
    return evidence('online', 'connector-runtime', input.observedAt);
  }
  return evidence('ready', 'connector-gate', input.observedAt);
}

function highestSupportLevel(input: {
  detected: boolean;
  installed: boolean;
  launchable: boolean;
  connector: AgentLibraryConnectorState;
}): AgentLibrarySupportLevel {
  let level: AgentLibrarySupportLevel = input.detected ? 'detected' : 'catalogued';
  if (input.installed) {
    level = 'installed';
  }
  if (input.launchable) {
    level = 'launchable';
  }
  if (input.connector === 'ready' || input.connector === 'online') {
    level = 'connectable';
  }
  if (input.connector === 'online' && input.launchable) {
    level = 'coordinatable';
  }
  return level;
}

function supportSource(
  level: AgentLibrarySupportLevel,
  manifest: AgentLibraryManifest,
  lifecycle: AgentHostLifecycleFact | undefined,
  connector: AgentLibraryEvidence<AgentLibraryConnectorState>
) {
  if (level === 'connectable' || level === 'coordinatable') {
    return connector.source;
  }
  if (level === 'launchable' || level === 'installed' || level === 'detected') {
    return lifecycle ? 'windows-lifecycle-probe' : 'codex-host-observation';
  }
  return manifest.catalogSource;
}

function evidence<T>(value: T, source: string, observedAt: string): AgentLibraryEvidence<T> {
  return { value, source, observedAt };
}

function projectVersionEvidence(
  version: AgentHostVersionEvidence | undefined,
  fallbackObservedAt: string
): AgentLibraryEvidence<string | null> {
  if (!version) {
    return evidence(null, 'version-not-observed', fallbackObservedAt);
  }
  return evidence(
    version.status === 'verified' ? version.value : null,
    version.source,
    version.observedAt || fallbackObservedAt
  );
}

function normalizeDate(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date(0).toISOString();
}
