import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { DesktopApi, Edge, RanchBounds, RanchPrefs } from '../../types';

const SNAP_THRESHOLD = 32;
const SNAP_HOLD_MS = 1000;

interface UseDockAndDragOptions {
  api: DesktopApi;
  prefs: RanchPrefs | null;
  isFloating: boolean;
  onPrefsChange: (prefs: RanchPrefs) => void;
  onError: (message: string) => void;
}

interface DragSession {
  startPointer: {
    screenX: number;
    screenY: number;
  };
  startBounds: RanchBounds;
  hoverEdge: Edge;
}

interface ScreenWorkArea {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function useDockAndDrag({
  api,
  prefs,
  isFloating,
  onPrefsChange,
  onError
}: UseDockAndDragOptions) {
  const [dragging, setDragging] = useState(false);
  const [dockPreviewEdge, setDockPreviewEdge] = useState<Edge>('none');
  const dragRef = useRef<DragSession | null>(null);
  const pendingBoundsRef = useRef<RanchBounds | null>(null);
  const frameRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const lastPointerRef = useRef<{ screenX: number; screenY: number } | null>(null);
  const prefsRef = useRef<RanchPrefs | null>(prefs);
  const onPrefsChangeRef = useRef(onPrefsChange);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  useEffect(() => {
    onPrefsChangeRef.current = onPrefsChange;
  }, [onPrefsChange]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    return () => {
      resetDragSession();
    };
  }, []);

  useEffect(() => {
    if (!isFloating && dragging) {
      resetDragSession();
    }
  }, [dragging, isFloating]);

  useEffect(() => {
    if (!dragging || !isFloating) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const session = dragRef.current;
      if (!session) {
        return;
      }

      lastPointerRef.current = {
        screenX: event.screenX,
        screenY: event.screenY
      };

      const workArea = readWorkArea();
      const rawBounds = clampBounds({
        x: session.startBounds.x + (event.screenX - session.startPointer.screenX),
        y: session.startBounds.y + (event.screenY - session.startPointer.screenY),
        width: session.startBounds.width,
        height: session.startBounds.height
      }, workArea);

      scheduleLiveBounds(rawBounds);

      const nextEdge = getNearestEdge(rawBounds, workArea);
      setDockPreviewEdge(nextEdge);

      if (nextEdge === 'none') {
        session.hoverEdge = 'none';
        clearHoldTimer();
        return;
      }

      if (session.hoverEdge === nextEdge) {
        return;
      }

      session.hoverEdge = nextEdge;
      clearHoldTimer();
      holdTimerRef.current = window.setTimeout(() => {
        const activeSession = dragRef.current;
        const pointer = lastPointerRef.current;
        if (!activeSession || !pointer || activeSession.hoverEdge !== nextEdge) {
          return;
        }

        const currentWorkArea = readWorkArea();
        const currentBounds = clampBounds({
          x: activeSession.startBounds.x + (pointer.screenX - activeSession.startPointer.screenX),
          y: activeSession.startBounds.y + (pointer.screenY - activeSession.startPointer.screenY),
          width: activeSession.startBounds.width,
          height: activeSession.startBounds.height
        }, currentWorkArea);
        const snappedBounds = snapBounds(currentBounds, nextEdge, currentWorkArea);

        cancelScheduledFrame();
        pendingBoundsRef.current = null;
        activeSession.startBounds = snappedBounds;
        activeSession.startPointer = pointer;
        void commitBounds(snappedBounds, nextEdge);
      }, SNAP_HOLD_MS);
    };

    const handleMouseUp = () => {
      const session = dragRef.current;
      const pointer = lastPointerRef.current ?? session?.startPointer;
      if (!session || !pointer) {
        resetDragSession();
        return;
      }

      const workArea = readWorkArea();
      const rawBounds = clampBounds({
        x: session.startBounds.x + (pointer.screenX - session.startPointer.screenX),
        y: session.startBounds.y + (pointer.screenY - session.startPointer.screenY),
        width: session.startBounds.width,
        height: session.startBounds.height
      }, workArea);
      const nextEdge = getNearestEdge(rawBounds, workArea);
      const finalBounds = nextEdge === 'none' ? rawBounds : snapBounds(rawBounds, nextEdge, workArea);

      cancelScheduledFrame();
      pendingBoundsRef.current = null;
      clearHoldTimer();
      dragRef.current = null;
      lastPointerRef.current = null;
      setDragging(false);
      setDockPreviewEdge('none');
      void commitBounds(finalBounds, nextEdge);
    };

    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mouseup', handleMouseUp, true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseup', handleMouseUp, true);
      clearHoldTimer();
    };
  }, [api, dragging, isFloating]);

  function onMouseDown(event: ReactMouseEvent<HTMLElement>) {
    if (!isFloating || event.button !== 0) {
      return;
    }

    const nextPrefs = prefsRef.current;
    if (!nextPrefs) {
      return;
    }

    const target = event.target;
    if (target instanceof Element && target.closest('[data-ranch-no-drag="true"]')) {
      return;
    }

    event.preventDefault();
    dragRef.current = {
      startPointer: {
        screenX: event.screenX,
        screenY: event.screenY
      },
      startBounds: {
        x: nextPrefs.position.x,
        y: nextPrefs.position.y,
        width: nextPrefs.size.width,
        height: nextPrefs.size.height
      },
      hoverEdge: 'none'
    };
    lastPointerRef.current = {
      screenX: event.screenX,
      screenY: event.screenY
    };
    setDragging(true);
    setDockPreviewEdge('none');
  }

  function scheduleLiveBounds(bounds: RanchBounds) {
    pendingBoundsRef.current = bounds;
    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const nextBounds = pendingBoundsRef.current;
      pendingBoundsRef.current = null;
      if (!nextBounds) {
        return;
      }

      void applyLiveBounds(nextBounds);
    });
  }

  async function applyLiveBounds(bounds: RanchBounds) {
    try {
      const nextPrefs = await api.ranch.setBounds(bounds);
      onPrefsChangeRef.current(nextPrefs);
    } catch (reason) {
      onErrorRef.current(reason instanceof Error ? reason.message : 'Desktop Ranch drag failed.');
    }
  }

  async function commitBounds(bounds: RanchBounds, edge: Edge) {
    try {
      await api.ranch.setBounds(bounds);
      const nextPrefs = await api.ranch.setPrefs({
        position: { x: bounds.x, y: bounds.y },
        size: { width: bounds.width, height: bounds.height },
        dockedEdge: edge
      });
      onPrefsChangeRef.current(nextPrefs);
    } catch (reason) {
      onErrorRef.current(reason instanceof Error ? reason.message : 'Desktop Ranch dock failed.');
    }
  }

  function resetDragSession() {
    cancelScheduledFrame();
    clearHoldTimer();
    dragRef.current = null;
    lastPointerRef.current = null;
    pendingBoundsRef.current = null;
    setDragging(false);
    setDockPreviewEdge('none');
  }

  function cancelScheduledFrame() {
    if (frameRef.current === null) {
      return;
    }

    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }

  function clearHoldTimer() {
    if (holdTimerRef.current === null) {
      return;
    }

    window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
  }

  return {
    dragging,
    dockPreviewEdge,
    onMouseDown
  };
}

function readWorkArea(): ScreenWorkArea {
  const browserScreen = window.screen as Screen & {
    availLeft?: number;
    availTop?: number;
  };
  const left = roundNumber(browserScreen.availLeft, 0);
  const top = roundNumber(browserScreen.availTop, 0);
  const width = roundNumber(browserScreen.availWidth, window.innerWidth);
  const height = roundNumber(browserScreen.availHeight, window.innerHeight);

  return {
    left,
    top,
    right: left + width,
    bottom: top + height
  };
}

function roundNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : Math.round(fallback);
}

function clampBounds(bounds: RanchBounds, workArea: ScreenWorkArea): RanchBounds {
  return {
    x: clamp(bounds.x, workArea.left, workArea.right - bounds.width),
    y: clamp(bounds.y, workArea.top, workArea.bottom - bounds.height),
    width: bounds.width,
    height: bounds.height
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getNearestEdge(bounds: RanchBounds, workArea: ScreenWorkArea): Edge {
  const distances: Array<{ edge: Edge; distance: number }> = [
    { edge: 'left', distance: Math.abs(bounds.x - workArea.left) },
    { edge: 'right', distance: Math.abs(workArea.right - (bounds.x + bounds.width)) },
    { edge: 'top', distance: Math.abs(bounds.y - workArea.top) },
    { edge: 'bottom', distance: Math.abs(workArea.bottom - (bounds.y + bounds.height)) }
  ];
  const nearest = distances.reduce((current, candidate) => (
    candidate.distance < current.distance ? candidate : current
  ));

  return nearest.distance <= SNAP_THRESHOLD ? nearest.edge : 'none';
}

function snapBounds(bounds: RanchBounds, edge: Edge, workArea: ScreenWorkArea): RanchBounds {
  switch (edge) {
    case 'left':
      return { ...bounds, x: workArea.left };
    case 'right':
      return { ...bounds, x: workArea.right - bounds.width };
    case 'top':
      return { ...bounds, y: workArea.top };
    case 'bottom':
      return { ...bounds, y: workArea.bottom - bounds.height };
    default:
      return bounds;
  }
}
