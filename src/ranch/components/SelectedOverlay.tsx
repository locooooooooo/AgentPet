import type { CSSProperties } from 'react';
import type { AIAgent, AgentDef, AnimalAction, NiuMaRuntimeState } from '../../types';

interface SelectedOverlayProps {
  agent: AIAgent;
  agentDef: AgentDef;
  runtime: NiuMaRuntimeState;
  action: AnimalAction;
}

export default function SelectedOverlay({ agent, agentDef, runtime, action }: SelectedOverlayProps) {
  return (
    <aside className="selected-overlay" style={{ '--agent-accent': agent.accent } as CSSProperties}>
      <div className="selected-avatar" aria-hidden="true">{agentDef.visual.glyph}</div>
      <div className="selected-copy">
        <span className="selected-kicker">{agent.slot} · {runtime.status}</span>
        <strong>{agent.name}</strong>
        <span>{agent.codename}</span>
        <p>{action.bubble ?? runtime.quote}</p>
      </div>
    </aside>
  );
}
