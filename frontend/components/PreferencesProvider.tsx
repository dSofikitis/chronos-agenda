"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  applyPreferences,
  DEFAULT_PREFERENCES,
  readPreferences,
  writePreferences,
  type Preferences,
} from "@/lib/preferences";

interface PreferencesContextValue {
  prefs: Preferences;
  set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  reset: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  // Start with defaults on the server; hydrate from localStorage on mount.
  // Renders one frame with defaults then snaps to the stored prefs — visually
  // imperceptible on cold loads and avoids server/client class mismatch.
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // Hydrate from localStorage on mount. The set-state-in-effect rule
    // flags this — but it's the canonical SSR-safe hydration pattern: the
    // server can't read localStorage, so the first paint uses defaults
    // and we snap to the stored value here.
    const loaded = readPreferences();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(loaded);
    applyPreferences(loaded);
  }, []);

  // Listen to system theme changes when theme=system.
  useEffect(() => {
    if (prefs.theme !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyPreferences(prefs);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [prefs]);

  const set = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      setPrefs((current) => {
        const next = { ...current, [key]: value };
        writePreferences(next);
        applyPreferences(next);
        return next;
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setPrefs(DEFAULT_PREFERENCES);
    writePreferences(DEFAULT_PREFERENCES);
    applyPreferences(DEFAULT_PREFERENCES);
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({ prefs, set, reset }),
    [prefs, set, reset],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used inside PreferencesProvider");
  }
  return ctx;
}

/**
 * Inline script injected before hydration to set the theme class on
 * <html> from localStorage / system, eliminating the dark-mode flash.
 * Stringified directly into a <script> tag in app/layout.tsx.
 */
export const NO_FLASH_SCRIPT = `
(function(){
  try {
    var raw = localStorage.getItem('chronos.preferences.v1');
    var prefs = raw ? JSON.parse(raw) : null;
    var mode = (prefs && prefs.theme) || 'system';
    var dark = mode === 'dark' || (mode === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.density = (prefs && prefs.density) || 'comfortable';
  } catch (e) { /* leave defaults */ }
})();
`;
