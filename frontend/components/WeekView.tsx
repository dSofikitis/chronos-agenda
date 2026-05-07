"use client";

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

  const byDay: Record<string, EventResponse[]> = {};
  for (const event of events) {
    const key = new Date(event.startsAt).toDateString();
    (byDay[key] ??= []).push(event);
  }

  return (
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

            {list.length === 0 ? (
              <p className="mt-2 text-xs text-ink-subtle">No events</p>
            ) : (
              <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                {list.map((event) => (
                  <EventPill
                    key={event.id}
                    event={event}
                    timeFormat={prefs.timeFormat}
                  />
                ))}
              </ul>
            )}

            {list.length > 0 && (
              <p className="mt-1.5 shrink-0 text-[10px] text-ink-subtle">
                {list.length} {list.length === 1 ? "event" : "events"}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EventPill({
  event,
  timeFormat,
}: {
  event: EventResponse;
  timeFormat: "12h" | "24h";
}) {
  const tooltip = [
    event.title,
    event.allDay
      ? "All day"
      : `${formatTime(event.startsAt, timeFormat)}–${formatTime(event.endsAt, timeFormat)}`,
    event.location || undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      title={tooltip}
      className="group flex items-center gap-1.5 rounded-md bg-surface px-1.5 py-1 text-xs ring-1 ring-divider/60 transition hover:ring-brand/40"
    >
      <span
        aria-hidden
        className="h-3 w-0.5 shrink-0 rounded-full bg-brand"
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
      <span className="truncate text-ink">{event.title}</span>
    </li>
  );
}
