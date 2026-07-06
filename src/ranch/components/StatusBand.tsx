import type { AgentSystemMessage } from '../../types';
import NotificationToast from './NotificationToast';

interface StatusBandProps {
  messages: AgentSystemMessage[];
}

export default function StatusBand({ messages }: StatusBandProps) {
  const activeMessage = messages[0];

  return (
    <section className="status-band" aria-label="牧场状态通知">
      {activeMessage ? <NotificationToast key={activeMessage.id} message={activeMessage} /> : null}
    </section>
  );
}
