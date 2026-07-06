import { useEffect, useMemo, useState } from 'react';
import type { AgentSnapshot, DesktopApi } from './types';
import { getDesktopApi } from './lib/desktopClient';
import NiuMaWorkspace from './components/NiuMaWorkspace';

export default function App() {
  const api = useMemo<DesktopApi>(() => getDesktopApi(), []);
  const [snapshot, setSnapshot] = useState<AgentSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return <NiuMaWorkspace api={api} snapshot={snapshot} onSnapshot={setSnapshot} />;
}
