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
              "flex min-h-32 flex-col rounded-2xl border bg-surface-card p-3 transition " +
              (isToday
                ? "border-brand/60 ring-1 ring-brand/30"
                : "border-divider")
            }
          >
            <div className="flex items-center justify-between">
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
            <ul className="mt-2 space-y-1.5 text-sm">
              {list.length === 0 && (
                <li className="text-xs text-ink-subtle">No events</li>
              )}
              {list.map((event) => (
                <li
                  key={event.id}
                  className="rounded-xl border border-divider bg-surface px-2.5 py-1.5 transition hover:border-brand/40"
                >
                  <div className="font-medium text-ink">{event.title}</div>
                  <div className="text-xs text-ink-muted">
                    {event.allDay
                      ? "All day"
                      : `${formatTime(event.startsAt, prefs.timeFormat)}–${formatTime(event.endsAt, prefs.timeFormat)}`}
                    {event.location && ` · ${event.location}`}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
