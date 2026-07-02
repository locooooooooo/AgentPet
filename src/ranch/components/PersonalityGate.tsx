import type { AgentSystemMessage, RanchPersonality } from '../../types';

const QUIET_TYPES = new Set<AgentSystemMessage['type']>(['success', 'warning', 'error']);

export function allowsRanchToast(personality: RanchPersonality, message: AgentSystemMessage) {
  if (personality === 'silent') {
    return false;
  }

  if (personality === 'quiet') {
    return QUIET_TYPES.has(message.type);
  }

  return true;
}
