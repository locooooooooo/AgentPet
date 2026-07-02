import type { AIAgent, AnimalAction, NiuMaRuntimeState, NiuMaStatus } from '../../types';
import { RANCH_WALK_TARGETS } from './ranchLayout';

const STATUS_ACTIONS: Record<NiuMaStatus, Omit<AnimalAction, 'bubble'>> = {
  idle: {
    pose: 'rest_sleep',
    motion: { kind: 'idle', repeat: true },
    particle: 'none'
  },
  coding: {
    pose: 'work_type',
    motion: { kind: 'shake', duration: 520, repeat: true },
    particle: 'spark'
  },
  debugging: {
    pose: 'work_pace',
    motion: { kind: 'walk', to: RANCH_WALK_TARGETS.work, duration: 900, repeat: true },
    particle: 'none'
  },
  meeting: {
    pose: 'meeting_circle',
    motion: { kind: 'walk', to: RANCH_WALK_TARGETS.plaza, duration: 900, repeat: false },
    particle: 'none'
  },
  coffee: {
    pose: 'coffee_sip',
    motion: { kind: 'idle', repeat: true },
    particle: 'none'
  },
  testing: {
    pose: 'test_drip',
    motion: { kind: 'shake', duration: 620, repeat: true },
    particle: 'spark'
  },
  deploying: {
    pose: 'deploy_pray',
    motion: { kind: 'idle', to: RANCH_WALK_TARGETS.release, duration: 900 },
    particle: 'spark'
  },
  done: {
    pose: 'done_cheer',
    motion: { kind: 'cheer', duration: 760, repeat: true },
    particle: 'flower'
  },
  overtime: {
    pose: 'overnight_dream',
    motion: { kind: 'lay', duration: 1200, repeat: true },
    particle: 'none'
  },
  drinkingWater: {
    pose: 'water_drink',
    motion: { kind: 'walk', to: RANCH_WALK_TARGETS.water, duration: 900 },
    particle: 'none'
  },
  panicking: {
    pose: 'panic_smoke',
    motion: { kind: 'shake', duration: 440, repeat: true },
    particle: 'smoke'
  },
  slacking: {
    pose: 'slack_phone',
    motion: { kind: 'idle', repeat: true },
    particle: 'none'
  },
  praying: {
    pose: 'praying',
    motion: { kind: 'idle', repeat: true },
    particle: 'spark'
  },
  demanding: {
    pose: 'demand_angry',
    motion: { kind: 'shake', duration: 520, repeat: true },
    particle: 'smoke'
  }
};

const FALLBACK_BUBBLES: Record<NiuMaStatus, string> = {
  idle: '低功耗待机中',
  coding: '码起来了',
  debugging: '排障巡逻',
  meeting: '同步对齐闭环',
  coffee: '咖啡续命',
  testing: '压测滴答',
  deploying: '发版祈祷',
  done: '完工',
  overtime: '今晚修仙',
  drinkingWater: '去饮水区',
  panicking: '生产救火',
  slacking: '带薪摸鱼',
  praying: '佛祖保佑',
  demanding: '需求压境'
};

export function pickAnimalAction(
  agent: AIAgent,
  runtime: NiuMaRuntimeState,
  salt: number
): AnimalAction {
  const base = STATUS_ACTIONS[runtime.status];
  const quote = runtime.quote.trim();
  const fallback = FALLBACK_BUBBLES[runtime.status];
  const name = salt % 2 === 0 ? agent.name : agent.codename;

  return {
    ...base,
    bubble: quote || `${name}：${fallback}`
  };
}
