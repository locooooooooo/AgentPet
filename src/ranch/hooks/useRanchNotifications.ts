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
  const timeoutIdsRef = useRef<number[]>([]);

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
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
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
      setToasts((currentToasts) => [latestMessage, ...currentToasts.filter((toast) => toast.id !== latestMessage.id)].slice(0, MAX_TOASTS));
      const timeoutId = window.setTimeout(() => {
        setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== latestMessage.id));
      }, TOAST_TTL_MS);
      timeoutIdsRef.current.push(timeoutId);
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
      setToasts([]);
    }
  }, [prefs?.notifyPrefs.bubble, prefs?.personality]);

  return toasts;
}
