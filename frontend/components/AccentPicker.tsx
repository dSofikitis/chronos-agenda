"use client";

import { ACCENT_PRESETS, type AccentName } from "@/lib/preferences";
import { usePreferences } from "@/components/PreferencesProvider";

export function AccentPicker({ compact = false }: { compact?: boolean }) {
  const { prefs, set } = usePreferences();
  const names = Object.keys(ACCENT_PRESETS) as AccentName[];

  return (
    <ul
      role="radiogroup"
      aria-label="Accent color"
      className={
        "flex items-center gap-2 " + (compact ? "" : "rounded-lg border border-divider bg-surface-card p-2")
      }
    >
      {names.map((name) => {
        const preset = ACCENT_PRESETS[name];
        const active = prefs.accent === name;
        return (
          <li key={name}>
            <button
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={preset.label}
              onClick={() => set("accent", name)}
              className={
                "size-6 rounded-full transition-transform " +
                (active
                  ? "ring-2 ring-offset-2 ring-offset-surface scale-110"
                  : "hover:scale-110")
              }
              style={{
                backgroundColor: preset.hex,
                boxShadow: active ? `0 0 0 2px ${preset.hex}` : undefined,
              }}
            />
          </li>
        );
      })}
    </ul>
  );
}
