"use client";

import { useState, useTransition } from "react";

import { createEventAction } from "./actions";

export function NewEventForm() {
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(suggestedStart());
  const [duration, setDuration] = useState(60);
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
        setDuration(60);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-5"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        New event
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_auto_1fr_auto]">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
          disabled={isPending}
        />
        <input
          required
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
          disabled={isPending}
        />
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
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
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </form>
  );
}

/** Default the picker to the next round hour. */
function suggestedStart(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  // datetime-local wants 'YYYY-MM-DDTHH:mm' in the user's local zone.
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}
