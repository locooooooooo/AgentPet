import type { CodexHostSnapshot } from '../types';
import type { AgentTruthProjection } from './agentInstanceProjection';

export function getCodexHostOnlineContribution(
  agentTruth: AgentTruthProjection,
  codexHost: CodexHostSnapshot
) {
  const codexAlreadyCounted = agentTruth.agents.some((agent) => (
    agent.connectorId === 'codex' && agent.isOnline
  ));
  return codexAlreadyCounted ? 0 : codexHost.activeSessionCount;
}

export function getCombinedOnlineSessionCount(
  agentTruth: AgentTruthProjection,
  codexHost: CodexHostSnapshot
) {
  return agentTruth.summary.onlineSessionCount
    + getCodexHostOnlineContribution(agentTruth, codexHost);
}
