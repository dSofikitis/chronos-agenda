"use client";

import { useEffect, useRef } from "react";

import { CloseIcon } from "@/components/icons";
import { formatTime } from "@/lib/format";
import type { TimeFormat } from "@/lib/preferences";
import type { EventResponse } from "@/lib/types";

interface Props {
  day: Date;
  events: EventResponse[];
  timeFormat: TimeFormat;
  isToday: boolean;
  onClose: () => void;
  onEdit: (event: EventResponse) => void;
  /** Compute "is past" once at open-time so all rows agree. */
  nowMs: number;
}

export function DayDetailDialog({
  day,
  events,
  timeFormat,
  isToday,
  onClose,
  onEdit,
  nowMs,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  const fullDate = day.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      role="presentation"
      onMouseDown={onBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-md animate-fade-in"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={fullDate}
        className="w-full max-w-md origin-center animate-bubble-pop overflow-hidden rounded-3xl border border-divider bg-surface/65 text-ink shadow-bubble backdrop-blur-lg"
      >
        <header className="relative border-b border-divider px-6 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
                {day.toLocaleDateString(undefined, { weekday: "long" })}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                {day.toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                })}
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                {day.getFullYear()}
                {events.length > 0 && (
                  <>
                    {" · "}
                    {events.length} {events.length === 1 ? "event" : "events"}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isToday && (
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand">
                  Today
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close day detail"
                className="rounded-md p-1 text-ink-muted hover:bg-surface-card hover:text-ink"
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>
          </div>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {sorted.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-subtle">
              No events scheduled.
            </p>
          ) : (
            <ul className="space-y-2">
              {sorted.map((event) => {
                const past = new Date(event.endsAt).getTime() < nowMs;
                return (
                  <li
                    key={event.id}
                    onDoubleClick={() => onEdit(event)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onEdit(event);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    title="Double-click (or Enter) to edit"
                    className={
                      "group cursor-pointer rounded-2xl border border-divider bg-surface-card p-3.5 transition hover:border-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
                      (past ? "opacity-55 hover:opacity-90" : "")
                    }
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={
                          "text-sm font-medium leading-tight " +
                          (past ? "line-through decoration-1" : "")
                        }
                      >
                        {event.title}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-muted">
                        {event.allDay
                          ? "All day"
                          : `${formatTime(event.startsAt, timeFormat)}–${formatTime(event.endsAt, timeFormat)}`}
                      </span>
                    </div>
                    {(event.location || event.notes) && (
                      <div className="mt-2 space-y-0.5 text-xs text-ink-muted">
                        {event.location && (
                          <p>
                            <span className="text-ink-subtle">Where: </span>
                            {event.location}
                          </p>
                        )}
                        {event.notes && (
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="border-t border-divider bg-surface-card/60 px-6 py-2.5 text-[11px] text-ink-subtle">
          Double-click an event to edit · Esc to close
        </footer>
      </div>
    </div>
  );
}
