import type { AgentSnapshot } from '../../types';
import { AGENT_ANIMALS, getAgentDef } from '../data/agentAnimals';
import { RANCH_ZONES } from '../data/ranchLayout';
import { pickAnimalAction } from '../data/statusActions';
import Animal from './Animal';

interface RanchCanvasProps {
  snapshot: AgentSnapshot;
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
}

export default function RanchCanvas({ snapshot, selectedAgentId, onSelectAgent }: RanchCanvasProps) {
  const visibleAgents = AGENT_ANIMALS
    .map((def) => {
      const agent = snapshot.agents.find((item) => item.id === def.agentId);
      const runtime = agent ? snapshot.runtime[agent.id] : null;
      return agent && runtime ? { agent, def, runtime } : null;
    })
    .filter(Boolean);

  return (
    <section className="ranch-canvas" aria-label="桌面牧场动物区">
      <div className="ranch-field">
        <div className="ranch-fence" aria-hidden="true" />
        <div className="ranch-ground">
          {RANCH_ZONES.map((zone) => (
            <span key={zone.id} className={`ranch-zone ${zone.className}`} aria-hidden="true">
              {zone.label}
            </span>
          ))}
          <span className="ranch-corner corner-nw" aria-hidden="true" />
          <span className="ranch-corner corner-ne" aria-hidden="true" />
          <span className="ranch-corner corner-se" aria-hidden="true" />
          <span className="ranch-corner corner-sw" aria-hidden="true" />
          {visibleAgents.map((item, index) => {
            if (!item) {
              return null;
            }
            const action = pickAnimalAction(item.agent, item.runtime, index);
            return (
              <Animal
                key={item.agent.id}
                agent={item.agent}
                agentDef={getAgentDef(item.agent.id) ?? item.def}
                runtime={item.runtime}
                action={action}
                selected={item.agent.id === selectedAgentId}
                onSelect={onSelectAgent}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
