"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";

import {
  deleteTaskAction,
  updateTaskAction,
} from "@/app/tasks/actions";
import { CloseIcon, TrashIcon } from "@/components/icons";
import type { TaskResponse } from "@/lib/types";

interface Props {
  task: TaskResponse;
  onClose: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 0, label: "Low" },
  { value: 1, label: "Normal" },
  { value: 2, label: "High" },
];

export function TaskEditDialog({ task, onClose }: Props) {
  const dialogId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(task.title);
  const [dueBy, setDueBy] = useState(toLocalInput(task.dueBy ?? null));
  const [priority, setPriority] = useState<number>(task.priority);
  const [status, setStatus] = useState<"open" | "done">(task.status);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isPending) return;
    setError(null);

    startTransition(async () => {
      try {
        await updateTaskAction(task.id, {
          title: title.trim(),
          // Empty string from the picker means "clear the due date"; the
          // server treats undefined as "leave as-is", null as "clear".
          dueBy: dueBy ? new Date(dueBy).toISOString() : null,
          priority,
          status,
          notes: notes.trim(),
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  const onDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteTaskAction(task.id);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-md animate-fade-in"
      onMouseDown={onBackdrop}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogId}
        className="w-full max-w-lg origin-center animate-bubble-pop overflow-hidden rounded-3xl border border-divider bg-surface/65 text-ink shadow-bubble backdrop-blur-lg"
      >
        <header className="flex items-center justify-between border-b border-divider px-5 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-subtle">
              Edit task
            </p>
            <h2 id={dialogId} className="text-sm font-semibold leading-tight">
              {task.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit dialog"
            className="rounded-md p-1 text-ink-muted hover:bg-surface-card hover:text-ink"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </header>

        <form onSubmit={onSave} className="space-y-4 px-5 py-4">
          <Field label="Title">
            <input
              ref={titleRef}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-surface-input px-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none ring-1 ring-divider focus:ring-brand"
              disabled={isPending}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Due by">
              <input
                type="datetime-local"
                value={dueBy}
                onChange={(e) => setDueBy(e.target.value)}
                className="w-full rounded-xl bg-surface-input px-3 py-2 text-sm text-ink outline-none ring-1 ring-divider focus:ring-brand"
                disabled={isPending}
              />
            </Field>
            <Field label="Priority">
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full rounded-xl bg-surface-input px-3 py-2 text-sm text-ink outline-none ring-1 ring-divider focus:ring-brand"
                disabled={isPending}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Status">
            <div className="inline-flex rounded-xl border border-divider bg-surface p-1 text-xs">
              {(["open", "done"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  aria-pressed={status === s}
                  className={
                    "rounded-lg px-3 py-1.5 capitalize transition " +
                    (status === s
                      ? "bg-brand text-brand-fg"
                      : "text-ink-muted hover:text-ink")
                  }
                  disabled={isPending}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Notes">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="w-full resize-none rounded-xl bg-surface-input px-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none ring-1 ring-divider focus:ring-brand"
              disabled={isPending}
            />
          </Field>

          {error && <p className="text-xs text-danger">{error}</p>}

          <footer className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-danger/40 bg-danger/10 px-3 py-1.5 text-sm font-medium text-danger transition hover:bg-danger/20 disabled:opacity-50"
            >
              <TrashIcon width={14} height={14} /> Delete
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-xl px-3 py-1.5 text-sm text-ink-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !title.trim()}
                className="rounded-xl bg-brand px-4 py-1.5 text-sm font-medium text-brand-fg transition hover:brightness-110 disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}
