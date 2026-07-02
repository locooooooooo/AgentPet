import { useEffect, useState } from 'react';
import type { DesktopApi, RanchMode, RanchPrefs } from '../../types';

export function useRanchMode(api: DesktopApi, initialPrefs: RanchPrefs | null) {
  const [prefs, setPrefs] = useState<RanchPrefs | null>(initialPrefs);

  useEffect(() => {
    setPrefs(initialPrefs);
  }, [initialPrefs]);

  useEffect(() => (
    api.ranch.onPrefsChanged((nextPrefs) => {
      setPrefs(nextPrefs);
    })
  ), [api]);

  const mode: RanchMode = prefs?.mode === 'floating' ? 'floating' : 'desktop';

  return {
    prefs,
    setPrefs,
    mode,
    isDesktop: mode === 'desktop',
    isFloating: mode === 'floating'
  };
}
