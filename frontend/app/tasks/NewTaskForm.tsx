"use client";

import { useState, useTransition } from "react";

import { createTaskAction } from "./actions";

const PRIORITY_OPTIONS = [
  { value: 0, label: "Low" },
  { value: 1, label: "Normal" },
  { value: 2, label: "High" },
];

export function NewTaskForm() {
  const [title, setTitle] = useState("");
  const [dueBy, setDueBy] = useState("");
  const [priority, setPriority] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isPending) return;
    setError(null);

    const payload = {
      title: title.trim(),
      priority,
      dueBy: dueBy ? new Date(dueBy).toISOString() : undefined,
    };

    startTransition(async () => {
      try {
        await createTaskAction(payload);
        setTitle("");
        setDueBy("");
        setPriority(1);
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
        New task
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
          disabled={isPending}
        />
        <input
          type="datetime-local"
          value={dueBy}
          onChange={(e) => setDueBy(e.target.value)}
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
          disabled={isPending}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
          disabled={isPending}
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
