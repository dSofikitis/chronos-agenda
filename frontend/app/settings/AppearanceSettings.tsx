"use client";

import { AccentPicker } from "@/components/AccentPicker";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";
import { usePreferences } from "@/components/PreferencesProvider";
import type { Density, ThemeMode } from "@/lib/preferences";

export function AppearanceSettings() {
  const { prefs, set, reset } = usePreferences();

  return (
    <section className="rounded-2xl border border-divider bg-surface-card p-5">
      <header className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Appearance
        </h2>
        <button
          type="button"
          onClick={reset}
          className="text-[11px] text-ink-subtle hover:text-ink"
        >
          Reset to defaults
        </button>
      </header>

      <div className="mt-4 space-y-5">
        <Row label="Theme" hint="Switches the entire UI. System follows your OS setting.">
          <ThemeButtons
            value={prefs.theme}
            onChange={(v) => set("theme", v)}
          />
        </Row>

        <Row label="Accent color" hint="Used on buttons, today highlights, and the assistant bubble.">
          <AccentPicker compact />
        </Row>

        <Row label="Density" hint="Controls list-row padding across the app.">
          <DensityToggle
            value={prefs.density}
            onChange={(v) => set("density", v)}
          />
        </Row>

        <Row label="Assistant hotkey" hint="Cmd / Ctrl-K toggles the assistant bubble.">
          <Switch
            checked={prefs.assistantHotkey}
            onChange={(v) => set("assistantHotkey", v)}
          />
        </Row>
      </div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ThemeButtons({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (v: ThemeMode) => void;
}) {
  const opts: { value: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
    { value: "light", label: "Light", Icon: SunIcon },
    { value: "system", label: "System", Icon: MonitorIcon },
    { value: "dark", label: "Dark", Icon: MoonIcon },
  ];
  return (
    <div className="inline-flex rounded-xl border border-divider bg-surface p-1 text-xs">
      {opts.map(({ value: v, label, Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition " +
            (value === v
              ? "bg-brand text-brand-fg"
              : "text-ink-muted hover:text-ink")
          }
        >
          <Icon width={14} height={14} />
          {label}
        </button>
      ))}
    </div>
  );
}

function DensityToggle({
  value,
  onChange,
}: {
  value: Density;
  onChange: (v: Density) => void;
}) {
  const opts: { value: Density; label: string }[] = [
    { value: "comfortable", label: "Comfortable" },
    { value: "compact", label: "Compact" },
  ];
  return (
    <div className="inline-flex rounded-xl border border-divider bg-surface p-1 text-xs">
      {opts.map(({ value: v, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={
            "rounded-lg px-3 py-1.5 transition " +
            (value === v
              ? "bg-brand text-brand-fg"
              : "text-ink-muted hover:text-ink")
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={
        "relative inline-flex h-6 w-11 items-center rounded-full transition " +
        (checked ? "bg-brand" : "bg-divider")
      }
    >
      <span
        className={
          "inline-block size-5 translate-x-0.5 rounded-full bg-white shadow-soft transition " +
          (checked ? "translate-x-[22px]" : "")
        }
      />
    </button>
  );
}
