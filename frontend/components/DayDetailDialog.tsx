"use client";

import { useEffect, useRef } from "react";

import { CloseIcon } from "@/components/icons";
import { Portal } from "@/components/Portal";
import { eventsForDay, type EventSlice } from "@/lib/eventSlices";
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

  const { allDay, timed } = eventsForDay(events, day);
  const total = allDay.length + timed.length;

  const fullDate = day.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Portal>
    <div
      role="presentation"
      onMouseDown={onBackdrop}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 backdrop-blur-md animate-fade-in"
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
                {total > 0 && (
                  <>
                    {" · "}
                    {total} {total === 1 ? "event" : "events"}
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
          {total === 0 ? (
            <p className="py-8 text-center text-sm text-ink-subtle">
              No events scheduled.
            </p>
          ) : (
            <div className="space-y-5">
              {allDay.length > 0 && (
                <Section label="All day">
                  {allDay.map((slice) => (
                    <DetailRow
                      key={slice.event.id}
                      slice={slice}
                      timeFormat={timeFormat}
                      past={new Date(slice.event.endsAt).getTime() < nowMs}
                      onEdit={() => onEdit(slice.event)}
                      kind="all-day"
                    />
                  ))}
                </Section>
              )}
              {timed.length > 0 && (
                <Section label="Scheduled">
                  {timed.map((slice) => (
                    <DetailRow
                      key={slice.event.id}
                      slice={slice}
                      timeFormat={timeFormat}
                      past={new Date(slice.event.endsAt).getTime() < nowMs}
                      onEdit={() => onEdit(slice.event)}
                      kind="timed"
                    />
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>

        <footer className="border-t border-divider bg-surface-card/60 px-6 py-2.5 text-[11px] text-ink-subtle">
          Double-click an event to edit · Esc to close
        </footer>
      </div>
    </div>
    </Portal>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
        {label}
      </h3>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

function DetailRow({
  slice,
  timeFormat,
  past,
  onEdit,
  kind,
}: {
  slice: EventSlice;
  timeFormat: TimeFormat;
  past: boolean;
  onEdit: () => void;
  kind: "all-day" | "timed";
}) {
  const { event, isStart, isEnd, isMultiDay } = slice;

  // Time chip shown in the upper-right of each row.
  let timeLabel: string;
  if (kind === "all-day") {
    if (isMultiDay) {
      const startDate = new Date(event.startsAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const endDate = new Date(event.endsAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      timeLabel = `${startDate} → ${endDate}`;
    } else {
      timeLabel = "All day";
    }
  } else if (isMultiDay && isStart) {
    timeLabel = `From ${formatTime(event.startsAt, timeFormat)}`;
  } else if (isMultiDay && isEnd) {
    timeLabel = `Until ${formatTime(event.endsAt, timeFormat)}`;
  } else {
    timeLabel = `${formatTime(event.startsAt, timeFormat)}–${formatTime(event.endsAt, timeFormat)}`;
  }

  // Subtle multi-day badge on the title row.
  const multiBadge = isMultiDay ? (
    <span className="ml-2 inline-flex items-center rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand">
      {isStart ? "starts" : isEnd ? "ends" : "ongoing"}
    </span>
  ) : null;

  return (
    <li
      onDoubleClick={() => onEdit()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEdit();
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
          {multiBadge}
        </span>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-muted">
          {timeLabel}
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
            <p className="whitespace-pre-wrap leading-relaxed">{event.notes}</p>
          )}
        </div>
      )}
    </li>
  );
}
