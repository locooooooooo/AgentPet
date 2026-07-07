import { LocateFixed } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { HomePageAgent } from '../types';

interface AnimalOverviewCardProps {
  agent: HomePageAgent;
  index: number;
  onFocus: (agentId: string) => void | Promise<void>;
}

export default function AnimalOverviewCard({ agent, index, onFocus }: AnimalOverviewCardProps) {
  const progress = Math.max(0, Math.min(100, Math.round((agent.energy + (100 - agent.stress)) / 2)));

  return (
    <article
      className="homepage-animal-card"
      style={{ '--agent-accent': agent.accent } as CSSProperties}
    >
      <button type="button" onClick={() => void onFocus(agent.id)}>
        <span className="homepage-animal-slot">{agent.slot || `#${index + 1}`}</span>
        <span className="homepage-animal-avatar" aria-hidden="true">{agent.avatar}</span>
        <span className="homepage-animal-name">{agent.name}</span>
        <span className="homepage-animal-code">{agent.codename}</span>
        <span className="homepage-animal-status">{agent.statusName}</span>
        <span className="homepage-animal-expression">{agent.expression}</span>
        <span className="homepage-animal-quote">{agent.quote}</span>
        <span className="homepage-animal-progress" aria-label={`综合状态 ${progress}%`}>
          <i style={{ width: `${progress}%` }} />
        </span>
        <span className="homepage-animal-footer">
          <span>{agent.runningTaskCount}/{agent.taskCount} running</span>
          <span>
            <LocateFixed size={13} />
            定位
          </span>
        </span>
      </button>
    </article>
  );
}
