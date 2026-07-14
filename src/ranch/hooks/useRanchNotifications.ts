import { useEffect, useRef, useState } from 'react';
import type { AgentSnapshot, AgentSystemMessage, DesktopApi, RanchPrefs } from '../../types';
import { allowsRanchToast } from '../components/PersonalityGate';

const TOAST_TTL_MS = 1500;
const MAX_TOASTS = 1;

export function useRanchNotifications(
  api: DesktopApi,
  snapshot: AgentSnapshot | null,
  prefs: RanchPrefs | null
) {
  const [toasts, setToasts] = useState<AgentSystemMessage[]>([]);
  const isHydratedRef = useRef(false);
  const lastMessageIdRef = useRef<string | null>(null);
  const prefsRef = useRef<RanchPrefs | null>(prefs);
  const toastTimeoutIdRef = useRef<number | null>(null);

  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  useEffect(() => {
    if (isHydratedRef.current || !snapshot) {
      return;
    }

    isHydratedRef.current = true;
    lastMessageIdRef.current = snapshot.messages[0]?.id ?? null;
  }, [snapshot]);

  useEffect(() => () => {
    if (toastTimeoutIdRef.current !== null) {
      window.clearTimeout(toastTimeoutIdRef.current);
      toastTimeoutIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    const latestMessage = snapshot?.messages[0];
    if (!isHydratedRef.current || !latestMessage || latestMessage.id === lastMessageIdRef.current) {
      return;
    }

    lastMessageIdRef.current = latestMessage.id;
    const currentPrefs = prefsRef.current;
    if (!currentPrefs) {
      return;
    }

    if (currentPrefs.notifyPrefs.bubble && allowsRanchToast(currentPrefs.personality, latestMessage)) {
      if (toastTimeoutIdRef.current !== null) {
        window.clearTimeout(toastTimeoutIdRef.current);
      }

      setToasts([latestMessage].slice(0, MAX_TOASTS));
      const timeoutId = window.setTimeout(() => {
        setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== latestMessage.id));
        if (toastTimeoutIdRef.current === timeoutId) {
          toastTimeoutIdRef.current = null;
        }
      }, TOAST_TTL_MS);
      toastTimeoutIdRef.current = timeoutId;
    }

    if (
      currentPrefs.notifyPrefs.system &&
      (latestMessage.type === 'success' || latestMessage.type === 'error')
    ) {
      void api.ranch.requestSystemNotify({
        title: latestMessage.title,
        body: latestMessage.content,
        agentId: latestMessage.agentId
      });
    }
  }, [api, snapshot]);

  useEffect(() => {
    if (prefs?.personality === 'silent' || prefs?.notifyPrefs.bubble === false) {
      if (toastTimeoutIdRef.current !== null) {
        window.clearTimeout(toastTimeoutIdRef.current);
        toastTimeoutIdRef.current = null;
      }
      setToasts([]);
    }
  }, [prefs?.notifyPrefs.bubble, prefs?.personality]);

  return toasts;
}
