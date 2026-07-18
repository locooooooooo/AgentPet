import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AgentSnapshot, CodexHostSnapshot, ConnectorRuntimeSnapshot, DesktopApi } from './types';
import { getDesktopApi } from './lib/desktopClient';
import { projectAgentInstances } from './lib/agentInstanceProjection';
import NiuMaWorkspace from './components/NiuMaWorkspace';
import HomePage from './homepage';

type AppView = 'home' | 'cockpit';

export default function App() {
  const api = useMemo<DesktopApi>(() => getDesktopApi(), []);
  const [snapshot, setSnapshot] = useState<AgentSnapshot | null>(null);
  const [connectorRuntimeSnapshot, setConnectorRuntimeSnapshot] = useState<ConnectorRuntimeSnapshot | null>(null);
  const [codexHostSnapshot, setCodexHostSnapshot] = useState<CodexHostSnapshot | null>(null);
  const [projectionNow, setProjectionNow] = useState(() => Date.now());
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

  useEffect(() => {
    let mounted = true;
    let unsubscribe = () => {};

    api.getCodexHostSnapshot()
      .then((nextSnapshot) => {
        if (mounted) {
          setCodexHostSnapshot(nextSnapshot);
        }
      })
      .catch(() => {
        if (mounted) {
          setCodexHostSnapshot(createFailClosedCodexHostSnapshot());
        }
      });

    try {
      unsubscribe = api.onCodexHostSnapshotChanged((nextSnapshot) => {
        if (mounted) {
          setCodexHostSnapshot(nextSnapshot);
        }
      });
    } catch {
      setCodexHostSnapshot(createFailClosedCodexHostSnapshot());
    }

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [api]);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = () => {};

    api.getConnectorRuntimeSnapshot()
      .then((nextSnapshot) => {
        if (mounted) {
          setConnectorRuntimeSnapshot(nextSnapshot);
        }
      })
      .catch((reason) => {
        if (mounted) {
          setConnectorRuntimeSnapshot(createFailClosedRuntimeSnapshot(
            Date.now(),
            reason instanceof Error ? reason.message : 'Connector runtime snapshot unavailable.'
          ));
        }
      });

    try {
      unsubscribe = api.onConnectorRuntimeSnapshotChanged((nextSnapshot) => {
        if (mounted) {
          setConnectorRuntimeSnapshot(nextSnapshot);
        }
      });
    } catch (reason) {
      setConnectorRuntimeSnapshot(createFailClosedRuntimeSnapshot(
        Date.now(),
        reason instanceof Error ? reason.message : 'Connector runtime subscription unavailable.'
      ));
    }

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [api]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProjectionNow(Date.now());
    }, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const agentTruth = useMemo(() => {
    const runtimeSnapshot = connectorRuntimeSnapshot ?? createFailClosedRuntimeSnapshot(
      projectionNow,
      'Connector runtime snapshot is still loading.'
    );
    try {
      return projectAgentInstances({
        configuredAgents: (snapshot?.agents ?? []).map((agent) => ({
          id: agent.id,
          connectorId: agent.id
        })),
        runtimeSnapshot,
        now: projectionNow
      });
    } catch (reason) {
      return projectAgentInstances({
        configuredAgents: (snapshot?.agents ?? []).map((agent) => ({
          id: agent.id,
          connectorId: agent.id
        })),
        runtimeSnapshot: createFailClosedRuntimeSnapshot(
          projectionNow,
          reason instanceof Error ? reason.message : 'Connector runtime projection failed.'
        ),
        now: projectionNow
      });
    }
  }, [connectorRuntimeSnapshot, projectionNow, snapshot]);

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
        agentTruth={agentTruth}
        codexHost={codexHostSnapshot ?? createFailClosedCodexHostSnapshot()}
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
      agentTruth={agentTruth}
      codexHost={codexHostSnapshot ?? createFailClosedCodexHostSnapshot()}
      onSnapshot={setSnapshot}
      onReturnHome={returnHome}
    />
  );
}

function createFailClosedCodexHostSnapshot(): CodexHostSnapshot {
  return {
    version: 1,
    availability: 'unavailable',
    source: 'browser-fallback',
    observedAt: new Date().toISOString(),
    clientRunning: false,
    activeSessionCount: 0,
    sessions: [],
    detail: 'Codex Desktop lifecycle snapshot is unavailable.'
  };
}

function createFailClosedRuntimeSnapshot(now: number, reason: string): ConnectorRuntimeSnapshot {
  const isDesktopRuntime = typeof window !== 'undefined' && Boolean(window.niumaDesk);
  const observedAt = new Date(now).toISOString();
  return {
    version: 1,
    updatedAt: observedAt,
    tasks: [],
    instances: [],
    hostDiscovery: {
      version: 1,
      availability: 'unavailable',
      source: isDesktopRuntime ? 'unavailable' : 'unsupported',
      observedAt,
      facts: [],
      lifecycle: [],
      detail: isDesktopRuntime
        ? 'Host-process discovery is unavailable.'
        : 'The browser fallback cannot inspect local Agent applications.'
    },
    runtime: {
      availability: 'unavailable',
      mode: isDesktopRuntime ? 'real' : 'simulated',
      source: isDesktopRuntime ? 'unknown' : 'browser-fallback',
      observedAt,
      reason
    }
  };
}
