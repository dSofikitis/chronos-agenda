"use client";

import { usePreferences } from "@/components/PreferencesProvider";
import type { TimeFormat, WeekStart } from "@/lib/preferences";

export function CalendarSettings() {
  const { prefs, set } = usePreferences();

  return (
    <section className="rounded-2xl border border-divider bg-surface-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Calendar
      </h2>

      <div className="mt-4 space-y-5">
        <Row label="Week starts on" hint="Rotates the week view grid.">
          <Segmented<WeekStart>
            value={prefs.weekStart}
            options={[
              { value: "monday", label: "Mon" },
              { value: "sunday", label: "Sun" },
            ]}
            onChange={(v) => set("weekStart", v)}
          />
        </Row>

        <Row label="Time format" hint="Affects event chips and the chat panel.">
          <Segmented<TimeFormat>
            value={prefs.timeFormat}
            options={[
              { value: "24h", label: "24-hour" },
              { value: "12h", label: "12-hour" },
            ]}
            onChange={(v) => set("timeFormat", v)}
          />
        </Row>

        <Row label="Hide weekends" hint="Saturday and Sunday are dropped from the week grid.">
          <Switch
            checked={prefs.hideWeekends}
            onChange={(v) => set("hideWeekends", v)}
          />
        </Row>

        <Row
          label="Hide ended events for today"
          hint="Past days stay visible (dimmed); only today's already-finished events get hidden."
        >
          <Switch
            checked={prefs.hidePastEventsToday}
            onChange={(v) => set("hidePastEventsToday", v)}
          />
        </Row>

        <Row
          label="Default event duration"
          hint="Pre-fills the duration on the agenda's quick-add form."
        >
          <select
            value={prefs.defaultEventDuration}
            onChange={(e) => set("defaultEventDuration", Number(e.target.value))}
            className="rounded-xl bg-surface-input px-3 py-2 text-sm text-ink outline-none ring-1 ring-divider focus:ring-brand"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
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

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-divider bg-surface p-1 text-xs">
      {options.map(({ value: v, label }) => (
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
