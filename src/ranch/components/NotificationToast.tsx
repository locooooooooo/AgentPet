import type { AgentSystemMessage } from '../../types';

interface NotificationToastProps {
  message: AgentSystemMessage;
}

export default function NotificationToast({ message }: NotificationToastProps) {
  return (
    <article className={`notification-toast toast-${message.type}`} aria-live="polite">
      <span className="toast-dot" aria-hidden="true" />
      <div className="toast-copy">
        <strong>{message.title}</strong>
        <p>{message.content}</p>
      </div>
    </article>
  );
}
