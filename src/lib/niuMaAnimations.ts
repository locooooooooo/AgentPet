import type { AIAgent, NiuMaRuntimeState, NiuMaStatus } from '../types';
import { STATE_METAS } from './agentCore';

// 4 个浮粒 emoji 装饰 + 对应的状态
// 来自旧版"数字牛马圈养提效中心":🔥 coding / ☕ coffee / 🚨 panicking / 💀 overtime
export interface ParticleEffect {
  emoji: string;
  position: 'top-right' | 'top-left' | 'top-tr' | 'top-tl';
  motionClass: 'pulse' | 'bounce' | 'ping';
}

export const PARTICLE_EFFECTS: Partial<Record<NiuMaStatus, ParticleEffect>> = {
  coding: { emoji: '🔥', position: 'top-right', motionClass: 'bounce' },
  coffee: { emoji: '☕', position: 'top-left', motionClass: 'pulse' },
  panicking: { emoji: '🚨', position: 'top-tr', motionClass: 'ping' },
  overtime: { emoji: '💀', position: 'top-tl', motionClass: 'bounce' },
  slacking: { emoji: '🌴', position: 'top-right', motionClass: 'pulse' },
  deploying: { emoji: '🚀', position: 'top-tr', motionClass: 'bounce' }
};

// framer-motion 14 态 keyframe 配置
// 移植自旧版 AIAgentsControl.tsx 的 getMotionAnimation
// 注意:本项目 motion v12,导出 animate prop 直接用 { animate, transition } 对象
export interface MotionAnimation {
  animate: Record<string, number | number[]>;
  transition: Record<string, unknown>;
}

export function getMotionAnimation(status: NiuMaStatus): MotionAnimation {
  switch (status) {
    case 'coding':
      return {
        animate: {
          x: [0, -2, 2, -2, 2, 0],
          y: [0, -1, 1, -1, 0],
          rotate: [0, -1, 1, -1, 0]
        },
        transition: { duration: 0.15, repeat: Infinity }
      };
    case 'debugging':
      return {
        animate: {
          rotate: [0, -6, 6, -6, 0],
          y: [0, -2, 0]
        },
        transition: { duration: 1.2, repeat: Infinity }
      };
    case 'panicking':
      return {
        animate: {
          y: [0, -12, 0, -12, 0],
          x: [0, -5, 5, -5, 0],
          scale: [1, 1.05, 0.95, 1]
        },
        transition: { duration: 0.35, repeat: Infinity }
      };
    case 'idle':
      return {
        animate: {
          scaleY: [1, 0.94, 1],
          y: [0, 3, 0]
        },
        transition: { duration: 2.5, repeat: Infinity }
      };
    case 'done':
      return {
        animate: {
          y: [0, -14, 0],
          rotate: [0, 15, -15, 0],
          scale: [1, 1.1, 1]
        },
        transition: { duration: 0.7, repeat: Infinity }
      };
    case 'overtime':
      return {
        animate: {
          scaleY: [1, 0.88, 1],
          opacity: [0.65, 1, 0.65]
        },
        transition: { duration: 3.5, repeat: Infinity }
      };
    case 'coffee':
      return {
        animate: {
          y: [0, -6, 0],
          scale: [1, 1.08, 1],
          rotate: [0, 360]
        },
        transition: {
          y: { duration: 1, repeat: Infinity },
          scale: { duration: 1, repeat: Infinity },
          rotate: { duration: 4, ease: 'linear' }
        }
      };
    case 'slacking':
      return {
        animate: {
          rotate: [-12, 12, -12],
          x: [-4, 4, -4]
        },
        transition: { duration: 2.2, repeat: Infinity }
      };
    case 'drinkingWater':
      return {
        animate: {
          y: [0, 4, 0],
          rotate: [0, -10, 0]
        },
        transition: { duration: 1.8, repeat: Infinity }
      };
    case 'praying':
      return {
        animate: {
          scaleY: [1, 0.8, 1],
          y: [0, 5, 0]
        },
        transition: { duration: 1, repeat: Infinity }
      };
    case 'demanding':
      return {
        animate: {
          x: [0, 8, 0],
          scale: [1, 1.12, 1],
          skewX: [0, -5, 0]
        },
        transition: { duration: 0.5, repeat: Infinity }
      };
    case 'meeting':
      return {
        animate: {
          y: [0, 4, 0],
          scaleY: [1, 0.93, 1]
        },
        transition: { duration: 1.3, repeat: Infinity }
      };
    case 'testing':
      return {
        animate: {
          y: [0, -8, 0],
          scaleX: [1, 0.95, 1.05, 1]
        },
        transition: { duration: 0.9, repeat: Infinity }
      };
    case 'deploying':
      return {
        animate: {
          y: [0, -8, 0],
          scaleX: [1, 0.95, 1.05, 1]
        },
        transition: { duration: 0.9, repeat: Infinity }
      };
  }
}

// 默认 fallback 动画(未知状态)
export function getDefaultMotionAnimation(): MotionAnimation {
  return {
    animate: { y: [0, -3, 0] },
    transition: { duration: 2, repeat: Infinity }
  };
}

// 给每个 agent 一组"性格默认态",在空闲时呈现差异化
// 来自旧版 getNiuMaEffectiveStatus
const AGENT_PERSONALITY: Record<string, NiuMaStatus> = {
  codex: 'idle',
  trae: 'slacking',
  qoder: 'praying',
  minimax: 'meeting',
  workbuddy: 'drinkingWater',
  openclaw: 'panicking',
  openccode: 'deploying',
  hermes: 'slacking'
};

// 状态优先级:
//  1. 有 running 任务 + 被画饼 → overtime
//  2. 有 running 任务 → 按 progress 切: <30 coding / <60 debugging / <80 testing / <95 deploying / ≥95 done
//  3. 用户手动切了态(runtime.customState)→ 沿用
//  4. 默认按 agent.id 给"性格态"
export function getNiuMaEffectiveStatus(agent: AIAgent, runtime: NiuMaRuntimeState): NiuMaStatus {
  if (runtime.observedStatus) {
    return runtime.observedStatus;
  }
  const runningTask = agent.tasks.find((task) => task.status === 'running');
  if (runningTask) {
    if (runtime.isFueledByPie) {
      return 'overtime';
    }
    const prog = runningTask.progress;
    if (prog < 30) return 'coding';
    if (prog < 60) return 'debugging';
    if (prog < 80) return 'testing';
    if (prog < 95) return 'deploying';
    return 'done';
  }

  if (runtime.customState) {
    return runtime.customState;
  }

  return AGENT_PERSONALITY[agent.id] ?? 'idle';
}

// 状态名称(中文)快捷访问
export function getStateName(status: NiuMaStatus): string {
  return STATE_METAS[status].name;
}

// 状态表情快捷访问
export function getStateExpression(status: NiuMaStatus): string {
  return STATE_METAS[status].expression;
}

// 状态 → 主题色 token (给 CSS var 注入)
export function getStateAccent(status: NiuMaStatus): string {
  switch (status) {
    case 'coding':
    case 'debugging':
    case 'testing':
    case 'deploying':
      return '#4da3ff';
    case 'meeting':
    case 'praying':
      return '#a78bfa';
    case 'coffee':
    case 'overtime':
      return '#ffb86b';
    case 'done':
      return '#00d68f';
    case 'panicking':
    case 'demanding':
      return '#ff4d5f';
    case 'slacking':
    case 'drinkingWater':
    case 'idle':
    default:
      return '#9aa0a6';
  }
}
