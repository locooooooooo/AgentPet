import type {
  AgentSystemMessage,
  ConnectorRuntimeAvailability,
  ConnectorRuntimeMode,
  ConnectorRuntimeSource,
  NiuMaStatus
} from '../types';

export type HomeMetricTone = 'green' | 'blue' | 'orange' | 'red' | 'violet';
export type HomeMetricIcon = 'activity' | 'shield' | 'plug' | 'bell';

export interface HomePageAgent {
  id: string;
  slot: string;
  name: string;
  codename: string;
  avatar: string;
  accent: string;
  status: NiuMaStatus;
  statusName: string;
  expression: string;
  quote: string;
  taskCount: number;
  runningTaskCount: number;
  energy: number;
  stress: number;
  temperature: number;
  lastInteractionAt: string;
}

export interface HomePageMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: HomeMetricTone;
  icon: HomeMetricIcon;
}

export interface HomePageData {
  agents: HomePageAgent[];
  metrics: HomePageMetric[];
  runningTaskCount: number;
  totalTaskCount: number;
  activeLaneCount: number;
  blockedLaneCount: number;
  standbyLaneCount: number;
  connectorCount: number;
  acceptedConnectorCount: number;
  blockedConnectorCount: number;
  onlineSessionCount: number;
  runtimeAvailability: ConnectorRuntimeAvailability;
  runtimeMode: ConnectorRuntimeMode;
  runtimeSource: ConnectorRuntimeSource;
  runtimeObservedAt: string;
  latestMessage: AgentSystemMessage | null;
}
