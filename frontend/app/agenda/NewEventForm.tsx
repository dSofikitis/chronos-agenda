"use client";

import { useState, useTransition } from "react";

import { createEventAction } from "./actions";
import { usePreferences } from "@/components/PreferencesProvider";

export function NewEventForm() {
  const { prefs } = usePreferences();
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(suggestedStart());
  const [duration, setDuration] = useState(prefs.defaultEventDuration);
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isPending) return;
    setError(null);

    const start = new Date(startsAt);
    const end = new Date(start.getTime() + duration * 60_000);

    startTransition(async () => {
      try {
        await createEventAction({
          title: title.trim(),
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          location: location.trim() || undefined,
        });
        setTitle("");
        setLocation("");
        setStartsAt(suggestedStart());
        setDuration(prefs.defaultEventDuration);
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
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Quick add
        </h2>
        <p className="text-[11px] text-ink-subtle">
          For natural language, ask the assistant.
        </p>
      </div>
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
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
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
