import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { AIAgent, NiuMaRuntimeState } from '../types';
import {
  PARTICLE_EFFECTS,
  getMotionAnimation,
  getNiuMaEffectiveStatus,
  getStateAccent,
  getStateName
} from '../lib/niuMaAnimations';
import { STATE_METAS } from '../lib/agentCore';

interface NiuMaAvatarProps {
  agent: AIAgent;
  runtime: NiuMaRuntimeState;
  selected?: boolean;
  compact?: boolean;
  /** 是否显示 speech bubble(默认 compact 不显示,详情面板显示) */
  showBubble?: boolean;
  /** 点击头像的回调(用于循环切态) */
  onClick?: (event: ReactMouseEvent<HTMLDivElement>) => void;
}

export default function NiuMaAvatar({
  agent,
  runtime,
  selected = false,
  compact = false,
  showBubble = false,
  onClick
}: NiuMaAvatarProps) {
  const effectiveStatus = getNiuMaEffectiveStatus(agent, runtime);
  const motionCfg = getMotionAnimation(effectiveStatus);
  const accent = getStateAccent(effectiveStatus);
  const meta = STATE_METAS[effectiveStatus];
  const particle = PARTICLE_EFFECTS[effectiveStatus];
  const bubble = showBubble && runtime.bubbleText ? runtime.bubbleText : null;
  const stateName = getStateName(effectiveStatus);
  const isPanicking = effectiveStatus === 'panicking';

  const stageSize = compact ? 62 : 94;
  const emojiSize = compact ? 34 : 50;

  return (
    <div
      className={`niuma-avatar ${compact ? 'niuma-avatar-compact' : ''} ${selected ? 'is-selected' : ''}`}
      style={{ '--agent-accent': agent.accent, '--state-accent': accent } as CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={`${agent.name} · ${stateName} · ${meta.expression}`}
    >
      {/* speech bubble 浮在舞台上方 */}
      <AnimatePresence>
        {bubble ? (
          <motion.div
            key="bubble"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="niuma-bubble"
          >
            <span>{bubble}</span>
            <span className="niuma-bubble-tail" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        className={`avatar-stage ${isPanicking ? 'is-panicking' : ''}`}
        style={{ width: stageSize, height: stageSize }}
        animate={motionCfg.animate}
        transition={motionCfg.transition}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
      >
        <span className="avatar-body" style={{ fontSize: emojiSize }}>
          {agent.avatar}
        </span>
        <span className="avatar-shadow" />

        {/* 4 个浮粒 emoji (仅在对应状态显示) */}
        {particle ? (
          <span className={`avatar-particle avatar-particle-${particle.position} avatar-particle-${particle.motionClass}`}>
            {particle.emoji}
          </span>
        ) : null}
      </motion.div>

      <span className="avatar-badge">{agent.badge}</span>
      {!compact ? <span className="avatar-state-label" style={{ color: accent }}>{stateName}</span> : null}
    </div>
  );
}
