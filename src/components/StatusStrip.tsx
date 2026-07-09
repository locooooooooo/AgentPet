import { Activity, ChevronDown, ShieldAlert } from 'lucide-react';
import type { AgentSystemMessage, ConnectorBlockedReason, ConnectorGateResult } from '../types';
import type { OrchestrationConnector } from '../lib/orchestrationStatus';

interface StatusStripProps {
  connectors: OrchestrationConnector[];
  gateResults: Record<string, ConnectorGateResult>;
  runningTaskCount: number;
  totalTaskCount: number;
  lastEvent?: AgentSystemMessage;
}

export default function StatusStrip({
  connectors,
  gateResults,
  runningTaskCount,
  totalTaskCount,
  lastEvent
}: StatusStripProps) {
  const gateSummary = getGateSummary(connectors, gateResults);
  const lastEventLabel = lastEvent ? `${lastEvent.title} · ${formatRelativeTime(lastEvent.timestamp)}` : 'idle';

  return (
    <section className="status-strip-shell" aria-label="状态管道摘要">
      <div className="status-strip" tabIndex={0}>
        <div className="status-strip-item primary">
          <Activity size={14} />
          <span>connector · {gateSummary.label}</span>
        </div>
        <div className="status-strip-item grow">
          <span>last event: {lastEventLabel}</span>
        </div>
        <ChevronDown size={14} className="status-strip-chevron" />
      </div>

      <div
        className="status-strip-dropdown"
        data-status-source="connector-policy-grid"
        role="list"
        aria-label="完整 connector 列表"
      >
        {connectors.map((connector) => (
          <article key={connector.id} className={`status-strip-connector-card ${connector.status}`} role="listitem">
            <div className="status-strip-connector-head">
              <strong>{connector.label}</strong>
              <span>{connector.status} · {connector.approvalStatus}</span>
            </div>
            <GateStatus result={gateResults[connector.id]} />
            <small>{connector.enabledByDefault ? '默认开启' : '默认禁用'} · {connector.cwdPolicy}</small>
            <small>{connector.approvalEvidence || connector.acceptanceGate}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function getGateSummary(
  connectors: OrchestrationConnector[],
  gateResults: Record<string, ConnectorGateResult>
) {
  const pending = connectors.filter((connector) => gateResults[connector.id] === undefined).length;
  const clear = connectors.filter((connector) => gateResults[connector.id]?.executable).length;
  const blocked = connectors.length - pending - clear;

  if (pending > 0) {
    return { label: `${pending} pending` };
  }

  if (blocked > 0) {
    return { label: `${blocked} blocked` };
  }

  return { label: `${clear} ready` };
}

function GateStatus({ result }: { result?: ConnectorGateResult }) {
  if (!result) {
    return (
      <div className="status-strip-gate pending">
        <ShieldAlert size={13} />
        <span>gate pending</span>
      </div>
    );
  }

  if (result.executable) {
    return (
      <div className="status-strip-gate status-only">
        <Activity size={13} />
        <span>gate clear · status only</span>
      </div>
    );
  }

  return (
    <div className="status-strip-gate blocked">
      <ShieldAlert size={13} />
      <span>{result.blockedReasons.map(formatBlockedReason).join(' · ')}</span>
    </div>
  );
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return value;
  }

  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) {
    return `${seconds}s 前`;
  }

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m 前`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours}h 前`;
}

function formatBlockedReason(reason: ConnectorBlockedReason) {
  const labels: Record<ConnectorBlockedReason, string> = {
    'policy-unavailable': 'policy unavailable',
    'connector-not-found': 'connector not found',
    'status-not-ready': 'status not ready',
    'approval-not-accepted': 'approval not accepted',
    'disabled-by-default': 'disabled by default',
    'command-missing': 'command missing',
    'command-not-discovered': 'command not discovered',
    'cwd-policy-invalid': 'cwd policy invalid',
    'env-not-allowlisted': 'env not allowlisted',
    'timeout-invalid': 'timeout invalid',
    'dangerous-command': 'dangerous command',
    'confirmation-required': 'confirmation required',
    'runner-unsupported': 'runner unsupported'
  };
  return labels[reason];
}
