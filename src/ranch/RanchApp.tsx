import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { PanelTopOpen, Repeat2, Settings } from 'lucide-react';
import type { AgentSnapshot, DesktopApi, RanchInteractiveRegion, RanchPrefs } from '../types';
import { getDesktopApi } from '../lib/desktopClient';
import RanchCanvas from './components/RanchCanvas';
import StatusBand from './components/StatusBand';
import { useDockAndDrag } from './hooks/useDockAndDrag';
import { useRanchMode } from './hooks/useRanchMode';
import { useRanchNotifications } from './hooks/useRanchNotifications';
import { useSelectedAgent } from './hooks/useSelectedAgent';

const DESKTOP_INTERACTIVE_SELECTOR = '.animal, .ranch-actions, .ranch-action-button';

function readDesktopInteractiveRegions(): RanchInteractiveRegion[] {
  return Array.from(document.querySelectorAll<HTMLElement>(DESKTOP_INTERACTIVE_SELECTOR))
    .map((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return null;
      }

      return {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    })
    .filter((region): region is RanchInteractiveRegion => Boolean(region));
}

export default function RanchApp() {
  const [api] = useState<DesktopApi>(() => getDesktopApi());
  const [snapshot, setSnapshot] = useState<AgentSnapshot | null>(null);
  const [bootPrefs, setBootPrefs] = useState<RanchPrefs | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const cockpitOpenAtRef = useRef(0);
  const desktopPassthroughRef = useRef<boolean | null>(null);

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
  const prefsReady = Boolean(prefs);

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

  async function showSettingsMenu(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    try {
      await api.ranch.showContextMenu({
        x: event.clientX,
        y: event.clientY,
        agentId: selectedAgentId
      });
    } catch (reason) {
      console.error(reason instanceof Error ? reason.message : 'Desktop Ranch failed to open settings menu.');
    }
  }

  async function toggleMode(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!prefs) {
      return;
    }

    try {
      const nextPrefs = await api.ranch.setPrefs({
        mode: prefs.mode === 'desktop' ? 'floating' : 'desktop'
      });
      setPrefs(nextPrefs);
    } catch (reason) {
      console.error(reason instanceof Error ? reason.message : 'Desktop Ranch failed to switch mode.');
    }
  }

  function openSelectedCockpit(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    void openCockpit(selectedAgentId);
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
    if (!prefsReady) {
      return;
    }

    if (!isDesktop) {
      void api.ranch.setInteractiveRegions([]);
      void api.ranch.setMousePassthrough(false);
      return;
    }

    let disposed = false;
    const setDesktopPassthrough = (passthrough: boolean) => {
      if (desktopPassthroughRef.current === passthrough) {
        return;
      }

      desktopPassthroughRef.current = passthrough;
      void api.ranch.setMousePassthrough(passthrough);
    };
    const publishInteractiveRegions = () => {
      if (disposed) {
        return;
      }

      void api.ranch.setInteractiveRegions(readDesktopInteractiveRegions());
    };
    const updatePassthroughFromPointer = (event: MouseEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY) ?? event.target;
      const interactiveNode = target instanceof Element
        ? target.closest(DESKTOP_INTERACTIVE_SELECTOR)
        : null;
      if (interactiveNode) {
        setDesktopPassthrough(false);
      }
    };

    publishInteractiveRegions();
    setDesktopPassthrough(true);

    const regionTimer = window.setInterval(publishInteractiveRegions, 250);
    window.addEventListener('mousemove', updatePassthroughFromPointer, true);
    window.addEventListener('pointermove', updatePassthroughFromPointer, true);
    window.addEventListener('resize', publishInteractiveRegions);
    window.addEventListener('scroll', publishInteractiveRegions, true);

    return () => {
      disposed = true;
      window.clearInterval(regionTimer);
      window.removeEventListener('mousemove', updatePassthroughFromPointer, true);
      window.removeEventListener('pointermove', updatePassthroughFromPointer, true);
      window.removeEventListener('resize', publishInteractiveRegions);
      window.removeEventListener('scroll', publishInteractiveRegions, true);
      void api.ranch.setInteractiveRegions([]);
      desktopPassthroughRef.current = null;
      void api.ranch.setMousePassthrough(false);
    };
  }, [api, isDesktop, prefsReady]);

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
      <nav className="ranch-actions is-hover-only" aria-label="桌面牧场入口" data-ranch-no-drag="true">
        <button
          type="button"
          className="ranch-action-button"
          aria-label="召唤控制舱"
          title="召唤控制舱"
          onClick={openSelectedCockpit}
        >
          <PanelTopOpen aria-hidden="true" size={15} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="ranch-action-button"
          aria-label="打开设置"
          title="打开设置"
          onClick={(event) => void showSettingsMenu(event)}
        >
          <Settings aria-hidden="true" size={15} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="ranch-action-button"
          aria-label="切换模式"
          title="切换模式"
          onClick={(event) => void toggleMode(event)}
        >
          <Repeat2 aria-hidden="true" size={15} strokeWidth={2} />
        </button>
      </nav>
    </main>
  );
}
