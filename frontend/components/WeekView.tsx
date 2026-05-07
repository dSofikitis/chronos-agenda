"use client";

import { useState } from "react";

import { EventEditDialog } from "@/components/EventEditDialog";
import { addDays, formatWeekday, isSameDay, isWeekend } from "@/lib/week";
import { formatTime } from "@/lib/format";
import { usePreferences } from "@/components/PreferencesProvider";
import type { EventResponse } from "@/lib/types";

export function WeekView({
  from,
  events,
}: {
  from: string;
  events: EventResponse[];
}) {
  const { prefs } = usePreferences();
  const [editing, setEditing] = useState<EventResponse | null>(null);
  const start = new Date(from);

  // Re-anchor server-supplied Monday-start window to the user's preferred
  // weekStart by rotating the day list. The events array already covers the
  // full week so no extra fetch is needed.
  let days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  if (prefs.weekStart === "sunday") {
    days = [addDays(start, -1), ...days.slice(0, 6)];
  }
  if (prefs.hideWeekends) {
    days = days.filter((d) => !isWeekend(d));
  }
  const today = new Date();
  const nowMs = today.getTime();

  const isPastEvent = (event: EventResponse) =>
    new Date(event.endsAt).getTime() < nowMs;

  const byDay: Record<string, EventResponse[]> = {};
  for (const event of events) {
    const key = new Date(event.startsAt).toDateString();
    (byDay[key] ??= []).push(event);
  }

  return (
    <>
      <div
        className={
          "grid gap-3 grid-cols-1 " +
          (prefs.hideWeekends ? "lg:grid-cols-5" : "lg:grid-cols-7")
        }
      >
        {days.map((day) => {
          const key = day.toDateString();
          const list = byDay[key] ?? [];
          const isToday = isSameDay(day, today);

          // On today, optionally drop events that have already ended. Past
          // days keep all of theirs (just dimmed) per the setting's intent.
          const visibleList =
            isToday && prefs.hidePastEventsToday
              ? list.filter((e) => !isPastEvent(e))
              : list;

          return (
            <div
              key={key}
              className={
                "flex h-72 flex-col rounded-2xl border bg-surface-card p-3 transition " +
                (isToday
                  ? "border-brand/60 ring-1 ring-brand/30"
                  : "border-divider")
              }
            >
              <div className="flex shrink-0 items-center justify-between">
                <span
                  className={
                    "text-xs uppercase tracking-wide " +
                    (isToday ? "text-brand" : "text-ink-muted")
                  }
                >
                  {formatWeekday(day)}
                </span>
                {isToday && (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand">
                    Today
                  </span>
                )}
              </div>

              {visibleList.length === 0 ? (
                <p className="mt-2 text-xs text-ink-subtle">
                  {list.length > 0 && isToday && prefs.hidePastEventsToday
                    ? "Nothing left today"
                    : "No events"}
                </p>
              ) : (
                <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                  {visibleList.map((event) => (
                    <EventPill
                      key={event.id}
                      event={event}
                      timeFormat={prefs.timeFormat}
                      past={isPastEvent(event)}
                      onEdit={() => setEditing(event)}
                    />
                  ))}
                </ul>
              )}

              {visibleList.length > 0 && (
                <p className="mt-1.5 shrink-0 text-[10px] text-ink-subtle">
                  {visibleList.length}{" "}
                  {visibleList.length === 1 ? "event" : "events"}
                  {isToday &&
                    prefs.hidePastEventsToday &&
                    list.length > visibleList.length && (
                      <span className="ml-1">
                        · {list.length - visibleList.length} hidden
                      </span>
                    )}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <EventEditDialog event={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function EventPill({
  event,
  timeFormat,
  past,
  onEdit,
}: {
  event: EventResponse;
  timeFormat: "12h" | "24h";
  past: boolean;
  onEdit: () => void;
}) {
  const tooltip = [
    event.title,
    event.allDay
      ? "All day"
      : `${formatTime(event.startsAt, timeFormat)}–${formatTime(event.endsAt, timeFormat)}`,
    event.location || undefined,
    past ? "(ended)" : undefined,
    "double-click to edit",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      title={tooltip}
      aria-label={tooltip}
      onDoubleClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit();
        }
      }}
      role="button"
      tabIndex={0}
      className={
        "group flex cursor-pointer select-none items-center gap-1.5 rounded-md bg-surface px-1.5 py-1 text-xs ring-1 ring-divider/60 transition hover:ring-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
        (past ? "opacity-45 hover:opacity-80" : "")
      }
    >
      <span
        aria-hidden
        className={
          "h-3 w-0.5 shrink-0 rounded-full " +
          (past ? "bg-ink-subtle" : "bg-brand")
        }
      />
      {event.allDay ? (
        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-subtle">
          ALL
        </span>
      ) : (
        <span className="font-mono text-[10px] tabular-nums text-ink-muted">
          {formatTime(event.startsAt, timeFormat)}
        </span>
      )}
      <span
        className={
          "truncate text-ink " + (past ? "line-through decoration-1" : "")
        }
      >
        {event.title}
      </span>
    </li>
  );
}
