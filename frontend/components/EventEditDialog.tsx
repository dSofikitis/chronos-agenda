"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";

import {
  deleteEventAction,
  updateEventAction,
} from "@/app/agenda/actions";
import { CloseIcon, TrashIcon } from "@/components/icons";
import type { EventResponse } from "@/lib/types";

interface Props {
  event: EventResponse;
  onClose: () => void;
}

export function EventEditDialog({ event, onClose }: Props) {
  const dialogId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(event.title);
  const [startsAt, setStartsAt] = useState(toLocalInput(event.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(event.endsAt));
  const [allDay, setAllDay] = useState(event.allDay);
  const [location, setLocation] = useState(event.location ?? "");
  const [notes, setNotes] = useState(event.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ESC closes; backdrop click closes; focus lands in the title field on open.
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

    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
      setError("Start and end must be valid datetimes.");
      return;
    }
    if (end.getTime() < start.getTime()) {
      setError("End time can't be before start time.");
      return;
    }

    startTransition(async () => {
      try {
        await updateEventAction(event.id, {
          title: title.trim(),
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          allDay,
          location: location.trim(),
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
        await deleteEventAction(event.id);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-fade-in"
      onMouseDown={onBackdrop}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogId}
        className="w-full max-w-lg origin-center animate-bubble-pop overflow-hidden rounded-2xl border border-divider bg-surface/65 text-ink shadow-bubble backdrop-blur-lg"
      >
        <header className="flex items-center justify-between border-b border-divider px-5 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-subtle">
              Edit event
            </p>
            <h2 id={dialogId} className="text-sm font-semibold leading-tight">
              {event.title}
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
            <Field label="Starts">
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-xl bg-surface-input px-3 py-2 text-sm text-ink outline-none ring-1 ring-divider focus:ring-brand"
                disabled={isPending}
              />
            </Field>
            <Field label="Ends">
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full rounded-xl bg-surface-input px-3 py-2 text-sm text-ink outline-none ring-1 ring-divider focus:ring-brand"
                disabled={isPending}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="size-4 cursor-pointer accent-brand"
              disabled={isPending}
            />
            <span className="text-ink">All-day event</span>
          </label>

          <Field label="Location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl bg-surface-input px-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none ring-1 ring-divider focus:ring-brand"
              disabled={isPending}
            />
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

/** Convert an ISO datetime to the `YYYY-MM-DDTHH:mm` shape <input type="datetime-local"> wants. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}
