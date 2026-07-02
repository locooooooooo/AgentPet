import type { AgentSystemMessage } from '../../types';
import NotificationToast from './NotificationToast';

interface StatusBandProps {
  messages: AgentSystemMessage[];
}

export default function StatusBand({ messages }: StatusBandProps) {
  return (
    <section className="status-band" aria-label="牧场状态通知">
      {messages.length > 0 ? (
        messages.map((message) => (
          <NotificationToast key={message.id} message={message} />
        ))
      ) : (
        <span className="status-band-empty">牧场巡逻中</span>
      )}
    </section>
  );
}
