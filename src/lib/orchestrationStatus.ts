import orchestrationStatus from '../../docs/orchestration/status.json';
import connectorPolicy from '../../docs/orchestration/connectors.json';

export type OrchestrationState = 'active' | 'blocked' | 'standby' | 'summarized';

export interface OrchestrationRole {
  id: string;
  title: string;
  owner: string;
  status: OrchestrationState;
  responsibility: string;
  tag: string;
  evidence: string;
}

export interface OrchestrationLane {
  id: string;
  title: string;
  role: string;
  state: OrchestrationState;
  nextAction: string;
}

export interface OrchestrationStatus {
  identity: string;
  loopState: string;
  dispatchState: string;
  target: string;
  source: string;
  blocker: string;
  roles: OrchestrationRole[];
  lanes: OrchestrationLane[];
}

export interface OrchestrationConnector {
  id: string;
  label: string;
  status: 'draft' | 'placeholder' | 'ready' | 'disabled';
  runner: 'local-command';
  command: string;
  args: string[];
  cwdPolicy: string;
  envAllowlist: string[];
  confirmation: string;
  timeoutSeconds: number;
  acceptanceGate: string;
  approvalStatus: 'not-requested' | 'pending' | 'accepted' | 'rejected';
  acceptedBy: string;
  acceptedAt: string;
  approvalEvidence: string;
  enabledByDefault: boolean;
}

export interface ConnectorPolicy {
  version: number;
  defaults: {
    cwdPolicy: string;
    envAllowlist: string[];
    confirmation: string;
    timeoutSeconds: number;
    dangerousCommandPatterns: string[];
  };
  connectors: OrchestrationConnector[];
}

export const ORCHESTRATION_STATUS = orchestrationStatus as OrchestrationStatus;
export const CONNECTOR_POLICY = connectorPolicy as ConnectorPolicy;
