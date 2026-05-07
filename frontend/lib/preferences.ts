/**
 * User preferences. Persisted to localStorage on the client; the server
 * never sees them. Defaults are picked so the app feels reasonable on
 * first load without forcing a configuration step.
 */

export type ThemeMode = "light" | "dark" | "system";
export type AccentName = "red" | "blue" | "violet" | "emerald" | "rose" | "amber";
export type Density = "comfortable" | "compact";
export type TimeFormat = "12h" | "24h";
export type WeekStart = "monday" | "sunday";

export interface Preferences {
  theme: ThemeMode;
  accent: AccentName;
  density: Density;
  timeFormat: TimeFormat;
  weekStart: WeekStart;
  hideWeekends: boolean;
  hidePastEventsToday: boolean;
  defaultEventDuration: number; // minutes
  assistantHotkey: boolean; // Cmd/Ctrl-K shortcut on/off
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  accent: "red",
  density: "comfortable",
  timeFormat: "24h",
  weekStart: "monday",
  hideWeekends: false,
  hidePastEventsToday: false,
  defaultEventDuration: 60,
  assistantHotkey: true,
};

// NOTE: keep RGB triplets in sync with the inline `accents` table in
// components/PreferencesProvider.tsx → NO_FLASH_SCRIPT. The no-flash
// script runs before React hydrates and can't import this file.
export const ACCENT_PRESETS: Record<AccentName, { label: string; hex: string; light: string; dark: string }> = {
  red: { label: "Red", hex: "#ef4444", light: "239 68 68", dark: "248 113 113" },
  blue: { label: "Blue", hex: "#3b82f6", light: "59 130 246", dark: "96 165 250" },
  violet: { label: "Violet", hex: "#8b5cf6", light: "139 92 246", dark: "167 139 250" },
  emerald: { label: "Emerald", hex: "#10b981", light: "16 185 129", dark: "52 211 153" },
  rose: { label: "Rose", hex: "#f43f5e", light: "244 63 94", dark: "251 113 133" },
  amber: { label: "Amber", hex: "#f59e0b", light: "245 158 11", dark: "251 191 36" },
};

const STORAGE_KEY = "chronos.preferences.v1";

export function readPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function writePreferences(prefs: Preferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage can be disabled in private mode; silently keep the in-memory copy.
  }
}

/**
 * Apply preferences to the DOM (theme class + accent CSS vars). Called from
 * the provider on mount and whenever a preference changes.
 */
export function applyPreferences(prefs: Preferences): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Theme.
  const isDark =
    prefs.theme === "dark" ||
    (prefs.theme === "system" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
  root.dataset.theme = isDark ? "dark" : "light";

  // Accent (separate light + dark values; the active one wins because the
  // dark overrides come after the light defaults in globals.css).
  const accent = ACCENT_PRESETS[prefs.accent];
  root.style.setProperty("--c-brand-light", accent.light);
  root.style.setProperty("--c-brand-dark", accent.dark);

  // Density.
  root.dataset.density = prefs.density;
}
