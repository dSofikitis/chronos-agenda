import { addDays, formatTime, formatWeekday } from "@/lib/week";
import type { EventResponse } from "@/lib/types";

export function WeekView({
  from,
  events,
}: {
  from: string;
  events: EventResponse[];
}) {
  const start = new Date(from);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  const byDay: Record<string, EventResponse[]> = {};
  for (const event of events) {
    const key = new Date(event.startsAt).toDateString();
    (byDay[key] ??= []).push(event);
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-7">
      {days.map((day) => {
        const key = day.toDateString();
        const list = byDay[key] ?? [];
        return (
          <div
            key={key}
            className="min-h-32 rounded-lg border border-zinc-800 bg-zinc-900 p-3"
          >
            <div className="text-xs uppercase tracking-wide text-zinc-400">
              {formatWeekday(day)}
            </div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {list.length === 0 && (
                <li className="text-xs text-zinc-600">No events</li>
              )}
              {list.map((event) => (
                <li
                  key={event.id}
                  className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1"
                >
                  <div className="font-medium text-zinc-200">{event.title}</div>
                  <div className="text-xs text-zinc-500">
                    {event.allDay
                      ? "All day"
                      : `${formatTime(event.startsAt)}–${formatTime(event.endsAt)}`}
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
