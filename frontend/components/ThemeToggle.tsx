"use client";

import { useState } from "react";

import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";
import { usePreferences } from "@/components/PreferencesProvider";
import type { ThemeMode } from "@/lib/preferences";

const MODES: { value: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
];

export function ThemeToggle() {
  const { prefs, set } = usePreferences();
  const [open, setOpen] = useState(false);
  const Active = MODES.find((m) => m.value === prefs.theme) ?? MODES[1];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Theme"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-divider bg-surface-card text-ink-muted hover:text-ink"
      >
        <Active.Icon width={16} height={16} />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-40 mt-2 w-36 origin-top-right animate-fade-in overflow-hidden rounded-lg border border-divider bg-surface-elevated text-sm shadow-bubble">
            <ul role="menu">
              {MODES.map(({ value, label, Icon }) => (
                <li key={value} role="none">
                  <button
                    role="menuitemradio"
                    aria-checked={prefs.theme === value}
                    onClick={() => {
                      set("theme", value);
                      setOpen(false);
                    }}
                    className={
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-ink hover:bg-surface-card " +
                      (prefs.theme === value ? "text-brand" : "")
                    }
                  >
                    <Icon width={14} height={14} />
                    <span>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
