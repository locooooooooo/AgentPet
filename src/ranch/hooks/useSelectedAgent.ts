import { useEffect, useState } from 'react';
import type { AgentSnapshot, RanchPrefs } from '../../types';

export function useSelectedAgent(snapshot: AgentSnapshot | null, prefs: RanchPrefs | null) {
  const fallbackId = snapshot?.agents[0]?.id ?? 'codex';
  const [selectedAgentId, setSelectedAgentId] = useState(prefs?.selectedAgentId ?? fallbackId);

  useEffect(() => {
    const nextId = prefs?.selectedAgentId ?? fallbackId;
    setSelectedAgentId((currentId) => (
      snapshot?.agents.some((agent) => agent.id === currentId) ? currentId : nextId
    ));
  }, [fallbackId, prefs?.selectedAgentId, snapshot]);

  const selectedAgent = snapshot?.agents.find((agent) => agent.id === selectedAgentId) ?? snapshot?.agents[0] ?? null;

  return {
    selectedAgent,
    selectedAgentId: selectedAgent?.id ?? selectedAgentId,
    setSelectedAgentId
  };
}
