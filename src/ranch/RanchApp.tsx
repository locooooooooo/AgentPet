import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { AgentSnapshot, DesktopApi, RanchPrefs } from '../types';
import { getDesktopApi } from '../lib/desktopClient';
import RanchCanvas from './components/RanchCanvas';
import StatusBand from './components/StatusBand';
import { useDockAndDrag } from './hooks/useDockAndDrag';
import { useRanchMode } from './hooks/useRanchMode';
import { useRanchNotifications } from './hooks/useRanchNotifications';
import { useSelectedAgent } from './hooks/useSelectedAgent';

const DESKTOP_INTERACTIVE_SELECTOR = '.animal, .ranch-field, .selected-overlay';

export default function RanchApp() {
  const [api] = useState<DesktopApi>(() => getDesktopApi());
  const [snapshot, setSnapshot] = useState<AgentSnapshot | null>(null);
  const [bootPrefs, setBootPrefs] = useState<RanchPrefs | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const cockpitOpenAtRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    Promise.all([api.getSnapshot(), api.ranch.getPrefs()])
      .then(([nextSnapshot, nextPrefs]) => {
        if (!mounted) {
          return;
        }

        setSnapshot(nextSnapshot);
        setBootPrefs(nextPrefs);
      })
      .catch((reason) => {
        if (!mounted) {
          return;
        }

        setBootError(reason instanceof Error ? reason.message : 'Desktop Ranch failed to load.');
      });

    const unsubscribeSnapshot = api.onSnapshotChanged((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return () => {
      mounted = false;
      unsubscribeSnapshot();
    };
  }, [api]);

  const { prefs, setPrefs, isDesktop, isFloating } = useRanchMode(api, bootPrefs);
  const { selectedAgentId, setSelectedAgentId } = useSelectedAgent(snapshot, prefs);
  const toasts = useRanchNotifications(api, snapshot, prefs);
  const { dragging, dockPreviewEdge, onMouseDown } = useDockAndDrag({
    api,
    prefs,
    isFloating,
    onPrefsChange: setPrefs,
    onError: (message) => console.error(message)
  });

  async function selectAgent(agentId: string) {
    setSelectedAgentId(agentId);
    if (!prefs || prefs.selectedAgentId === agentId) {
      return;
    }

    try {
      const nextPrefs = await api.ranch.setPrefs({ selectedAgentId: agentId });
      setPrefs(nextPrefs);
    } catch (reason) {
      console.error(reason instanceof Error ? reason.message : 'Desktop Ranch failed to save selection.');
    }
  }

  async function openCockpit(agentId: string) {
    if (prefs?.selectedAgentId !== agentId) {
      void selectAgent(agentId);
    }

    const now = Date.now();
    if (now - cockpitOpenAtRef.current < 280) {
      return;
    }

    cockpitOpenAtRef.current = now;

    try {
      await api.ranch.openCockpit();
      await api.ranch.resetUnread();
    } catch (reason) {
      console.error(reason instanceof Error ? reason.message : 'Desktop Ranch failed to open cockpit.');
    }
  }

  async function showContextMenu(event: ReactMouseEvent<HTMLElement>) {
    event.preventDefault();

    const target = event.target;
    const agentNode = target instanceof Element ? target.closest<HTMLElement>('.animal[data-agent-id]') : null;
    const agentId = agentNode?.dataset.agentId ?? null;

    if (agentId && prefs?.selectedAgentId !== agentId) {
      void selectAgent(agentId);
    }

    try {
      await api.ranch.showContextMenu({
        x: event.clientX,
        y: event.clientY,
        agentId
      });
    } catch (reason) {
      console.error(reason instanceof Error ? reason.message : 'Desktop Ranch failed to open context menu.');
    }
  }

  function handleDoubleClick(event: ReactMouseEvent<HTMLElement>) {
    const target = event.target;
    const agentNode = target instanceof Element ? target.closest<HTMLElement>('.animal[data-agent-id]') : null;
    const agentId = agentNode?.dataset.agentId;
    if (!agentId) {
      return;
    }

    void openCockpit(agentId);
  }

  useEffect(() => {
    if (!prefs) {
      return;
    }

    if (!isDesktop) {
      void api.ranch.setMousePassthrough(false);
      return;
    }

    let interactive = false;
    const syncPassthrough = (nextInteractive: boolean) => {
      if (interactive === nextInteractive) {
        return;
      }

      interactive = nextInteractive;
      void api.ranch.setMousePassthrough(!nextInteractive);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const target = event.target;
      syncPassthrough(target instanceof Element && Boolean(target.closest(DESKTOP_INTERACTIVE_SELECTOR)));
    };

    const handleMouseOut = (event: MouseEvent) => {
      if (!(event.relatedTarget instanceof Element)) {
        syncPassthrough(false);
      }
    };

    void api.ranch.setMousePassthrough(true);
    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mouseout', handleMouseOut, true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseout', handleMouseOut, true);
      void api.ranch.setMousePassthrough(false);
    };
  }, [api, isDesktop, prefs]);

  if (bootError) {
    return (
      <main className="ranch-shell" aria-label="Desktop Ranch">
        <section className="ranch-error">
          <span className="ranch-kicker">Ranch Boot Failed</span>
          <h1>Desktop Ranch failed to load</h1>
          <p>{bootError}</p>
        </section>
      </main>
    );
  }

  if (!snapshot || !prefs) {
    return (
      <main className="ranch-shell" aria-label="Desktop Ranch">
        <section className="ranch-boot-card">
          <span className="ranch-kicker">Desktop Ranch M0</span>
          <h1>Ranch Boot</h1>
          <p>Restoring the local herd, task queue, and ranch state...</p>
        </section>
      </main>
    );
  }

  const shellClassName = [
    'ranch-shell',
    isFloating ? 'is-floating' : 'is-desktop',
    dragging ? 'is-dragging' : '',
    dockPreviewEdge !== 'none' ? `dock-preview-${dockPreviewEdge}` : ''
  ].filter(Boolean).join(' ');

  return (
    <main
      className={shellClassName}
      aria-label="Desktop Ranch"
      onContextMenu={(event) => void showContextMenu(event)}
      onDoubleClick={handleDoubleClick}
      onMouseDown={onMouseDown}
    >
      <StatusBand messages={toasts} />
      <RanchCanvas snapshot={snapshot} selectedAgentId={selectedAgentId} onSelectAgent={selectAgent} />
    </main>
  );
}
