import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AgentSnapshot, DesktopApi } from './types';
import { getDesktopApi } from './lib/desktopClient';
import NiuMaWorkspace from './components/NiuMaWorkspace';
import HomePage from './homepage';

type AppView = 'home' | 'cockpit';

export default function App() {
  const api = useMemo<DesktopApi>(() => getDesktopApi(), []);
  const [snapshot, setSnapshot] = useState<AgentSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<AppView>('home');

  useEffect(() => {
    let mounted = true;
    api.getSnapshot()
      .then((nextSnapshot) => {
        if (mounted) {
          setSnapshot(nextSnapshot);
        }
      })
      .catch((reason) => {
        if (mounted) {
          setError(reason instanceof Error ? reason.message : '无法加载 agent 状态。');
        }
      });

    const unsubscribe = api.onSnapshotChanged((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [api]);

  const enterCockpit = useCallback(() => {
    setView('cockpit');
  }, []);

  const returnHome = useCallback(() => {
    setView('home');
  }, []);

  const focusRanchAnimal = useCallback(async (agentId: string) => {
    await api.ranch.setPrefs({ selectedAgentId: agentId });
  }, [api]);

  if (error) {
    return (
      <div className="boot-screen">
        <h1>桌面牧场 · 控制舱</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="boot-screen">
        <h1>桌面牧场 · 控制舱</h1>
        <p>正在恢复本地工位、任务队列和牛马状态...</p>
      </div>
    );
  }

  if (view === 'home') {
    return (
      <HomePage
        snapshot={snapshot}
        onEnterCockpit={enterCockpit}
        onFocusAnimal={focusRanchAnimal}
        onOpenSettings={enterCockpit}
      />
    );
  }

  return (
    <NiuMaWorkspace
      api={api}
      snapshot={snapshot}
      onSnapshot={setSnapshot}
      onReturnHome={returnHome}
    />
  );
}
