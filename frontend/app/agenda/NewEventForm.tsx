"use client";

import { useState, useTransition } from "react";

import { createEventAction } from "./actions";
import { usePreferences } from "@/components/PreferencesProvider";

type Mode = "timed" | "all-day";

export function NewEventForm() {
  const { prefs } = usePreferences();
  const [mode, setMode] = useState<Mode>("timed");

  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(suggestedStart());
  const [duration, setDuration] = useState(prefs.defaultEventDuration);
  // All-day mode: separate date inputs (no time component).
  const [startDate, setStartDate] = useState(toLocalDate(new Date()));
  const [endDate, setEndDate] = useState(toLocalDate(new Date()));
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setTitle("");
    setLocation("");
    setStartsAt(suggestedStart());
    setDuration(prefs.defaultEventDuration);
    setStartDate(toLocalDate(new Date()));
    setEndDate(toLocalDate(new Date()));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isPending) return;
    setError(null);

    let start: Date;
    let end: Date;
    if (mode === "all-day") {
      start = startOfLocalDay(startDate);
      end = endOfLocalDay(endDate || startDate);
      if (end.getTime() < start.getTime()) {
        setError("End date can't be before start date.");
        return;
      }
    } else {
      start = new Date(startsAt);
      end = new Date(start.getTime() + duration * 60_000);
    }

    startTransition(async () => {
      try {
        await createEventAction({
          title: title.trim(),
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          allDay: mode === "all-day",
          location: location.trim() || undefined,
        });
        reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-2xl border border-divider bg-surface-card p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Quick add
        </h2>
        <ModeToggle value={mode} onChange={setMode} disabled={isPending} />
      </div>

      {mode === "timed" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_auto_1fr_auto]">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="rounded-xl bg-surface-input px-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none ring-1 ring-divider focus:ring-brand"
            disabled={isPending}
          />
          <input
            required
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="rounded-xl bg-surface-input px-3 py-2 text-sm text-ink outline-none ring-1 ring-divider focus:ring-brand"
            disabled={isPending}
          />
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="rounded-xl bg-surface-input px-3 py-2 text-sm text-ink outline-none ring-1 ring-divider focus:ring-brand"
            disabled={isPending}
          >
            <option value={15}>15m</option>
            <option value={30}>30m</option>
            <option value={45}>45m</option>
            <option value={60}>1h</option>
            <option value={90}>1.5h</option>
            <option value={120}>2h</option>
            <option value={180}>3h</option>
            <option value={240}>4h</option>
            <option value={480}>8h</option>
          </select>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="rounded-xl bg-surface-input px-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none ring-1 ring-divider focus:ring-brand"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending || !title.trim()}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition hover:brightness-110 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="All-day event title"
            className="rounded-xl bg-surface-input px-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none ring-1 ring-divider focus:ring-brand"
            disabled={isPending}
          />
          <input
            required
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (!endDate || endDate < e.target.value) {
                setEndDate(e.target.value);
              }
            }}
            className="rounded-xl bg-surface-input px-3 py-2 text-sm text-ink outline-none ring-1 ring-divider focus:ring-brand"
            disabled={isPending}
          />
          <input
            required
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl bg-surface-input px-3 py-2 text-sm text-ink outline-none ring-1 ring-divider focus:ring-brand"
            disabled={isPending}
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="rounded-xl bg-surface-input px-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none ring-1 ring-divider focus:ring-brand"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending || !title.trim()}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition hover:brightness-110 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}

function ModeToggle({
  value,
  onChange,
  disabled,
}: {
  value: Mode;
  onChange: (v: Mode) => void;
  disabled: boolean;
}) {
  const opts: { value: Mode; label: string }[] = [
    { value: "timed", label: "Timed" },
    { value: "all-day", label: "All-day" },
  ];
  return (
    <div className="inline-flex rounded-xl border border-divider bg-surface p-1 text-[11px]">
      {opts.map(({ value: v, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          disabled={disabled}
          className={
            "rounded-lg px-3 py-1 transition disabled:opacity-50 " +
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

function suggestedStart(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function toLocalDate(d: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse `YYYY-MM-DD` and return midnight in the user's local zone. */
function startOfLocalDay(yyyymmdd: string): Date {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** Parse `YYYY-MM-DD` and return 23:59:59.999 in the user's local zone. */
function endOfLocalDay(yyyymmdd: string): Date {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}
