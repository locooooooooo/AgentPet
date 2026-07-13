import { LocateFixed } from 'lucide-react';
import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import type { HomePageAgent } from '../types';
import {
  PARTICLE_EFFECTS,
  getMotionAnimation,
  getStateAccent
} from '../../lib/niuMaAnimations';

interface AnimalOverviewCardProps {
  agent: HomePageAgent;
  index: number;
  onFocus: (agentId: string) => void | Promise<void>;
}

export default function AnimalOverviewCard({ agent, index, onFocus }: AnimalOverviewCardProps) {
  const progress = Math.max(0, Math.min(100, Math.round((agent.energy + (100 - agent.stress)) / 2)));
  const motionCfg = getMotionAnimation(agent.status);
  const accent = getStateAccent(agent.status);
  const particle = PARTICLE_EFFECTS[agent.status];

  return (
    <article
      className="homepage-animal-card"
      style={{ '--agent-accent': agent.accent, '--state-accent': accent } as CSSProperties}
    >
      <button type="button" onClick={() => void onFocus(agent.id)}>
        <span className="homepage-animal-slot">{agent.slot || `#${index + 1}`}</span>
        <motion.span
          className="homepage-animal-avatar"
          aria-hidden="true"
          animate={motionCfg.animate}
          transition={motionCfg.transition}
        >
          <span className="homepage-animal-glyph">{agent.avatar}</span>
          {particle ? (
            <span
              className={`homepage-animal-particle particle-${particle.position} particle-motion-${particle.motionClass}`}
              aria-hidden="true"
            >
              {particle.emoji}
            </span>
          ) : null}
        </motion.span>
        <span className="homepage-animal-name">{agent.name}</span>
        <span className="homepage-animal-code">{agent.codename}</span>
        <span className="homepage-animal-status">{agent.statusName}</span>
        <span className="homepage-animal-expression">{agent.expression}</span>
        <span className="homepage-animal-quote">{agent.quote}</span>
        <span className="homepage-animal-progress" aria-label={`综合状态 ${progress}%`}>
          <i style={{ width: `${progress}%` }} />
        </span>
        <span className="homepage-animal-footer">
          <span>{agent.runningTaskCount} 运行中 / {agent.taskCount} 应用任务</span>
          <span>
            <LocateFixed size={13} />
            定位
          </span>
        </span>
      </button>
    </article>
  );
}
