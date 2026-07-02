import type { AgentDef } from '../../types';

export const AGENT_ANIMALS: AgentDef[] = [
  {
    agentId: 'codex',
    displayName: 'Codex',
    codename: '批发排障',
    visual: { kind: 'emoji', glyph: '🐂' },
    defaultPosition: { x: 18, y: 62 },
    idleAnimation: 'breathe'
  },
  {
    agentId: 'trae',
    displayName: 'Trae',
    codename: '带薪拉屎',
    visual: { kind: 'emoji', glyph: '🦓' },
    defaultPosition: { x: 36, y: 62 },
    idleAnimation: 'sway'
  },
  {
    agentId: 'qoder',
    displayName: 'Qoder',
    codename: '佛祖保佑',
    visual: { kind: 'emoji', glyph: '🦉' },
    defaultPosition: { x: 56, y: 63 },
    idleAnimation: 'glance'
  },
  {
    agentId: 'minimax',
    displayName: 'MiniMax',
    codename: '废话周会',
    visual: { kind: 'emoji', glyph: '🦚' },
    defaultPosition: { x: 75, y: 62 },
    idleAnimation: 'sway'
  },
  {
    agentId: 'workbuddy',
    displayName: 'WorkBuddy',
    codename: '打水摸鱼',
    visual: { kind: 'emoji', glyph: '🦥' },
    defaultPosition: { x: 24, y: 34 },
    idleAnimation: 'breathe'
  },
  {
    agentId: 'openclaw',
    displayName: 'OpenClaw',
    codename: '生产救火',
    visual: { kind: 'emoji', glyph: '🦨' },
    defaultPosition: { x: 46, y: 33 },
    idleAnimation: 'glance'
  },
  {
    agentId: 'openccode',
    displayName: 'OpenCCode',
    codename: '佛系发版',
    visual: { kind: 'emoji', glyph: '🐢' },
    defaultPosition: { x: 66, y: 34 },
    idleAnimation: 'breathe'
  },
  {
    agentId: 'hermes',
    displayName: 'Hermes',
    codename: '热舞躺平',
    visual: { kind: 'emoji', glyph: '🦊' },
    defaultPosition: { x: 84, y: 36 },
    idleAnimation: 'sway'
  }
];

export function getAgentDef(agentId: string) {
  return AGENT_ANIMALS.find((def) => def.agentId === agentId);
}
