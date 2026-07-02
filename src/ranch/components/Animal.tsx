import type { CSSProperties } from 'react';
import type { AIAgent, AgentDef, AnimalAction, NiuMaRuntimeState } from '../../types';

interface AnimalProps {
  agent: AIAgent;
  agentDef: AgentDef;
  runtime: NiuMaRuntimeState;
  action: AnimalAction;
  selected: boolean;
  onSelect: (agentId: string) => void;
}

export default function Animal({ agent, agentDef, runtime, action, selected, onSelect }: AnimalProps) {
  const style = {
    '--agent-accent': agent.accent,
    '--animal-x': `${agentDef.defaultPosition.x}%`,
    '--animal-y': `${agentDef.defaultPosition.y}%`
  } as CSSProperties;

  return (
    <button
      type="button"
      className={[
        'animal',
        `pose-${action.pose}`,
        `motion-${action.motion?.kind ?? 'idle'}`,
        `idle-${agentDef.idleAnimation}`,
        selected ? 'is-selected' : ''
      ].filter(Boolean).join(' ')}
      style={style}
      aria-pressed={selected}
      aria-label={`${agent.name} · ${agent.codename} · ${runtime.status}`}
      data-agent-id={agent.id}
      data-ranch-no-drag="true"
      onClick={() => onSelect(agent.id)}
    >
      <span className="animal-bubble">{action.bubble}</span>
      <span className="animal-ring" aria-hidden="true">
        <span className="animal-glyph">{agentDef.visual.glyph}</span>
      </span>
      <span className="animal-label">
        <strong>{agent.name}</strong>
        <em>{agentDef.codename}</em>
      </span>
      {action.particle && action.particle !== 'none' ? (
        <span className={`animal-particle particle-${action.particle}`} aria-hidden="true" />
      ) : null}
    </button>
  );
}
