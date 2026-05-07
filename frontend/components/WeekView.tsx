"use client";

import { useState } from "react";

import { DayDetailDialog } from "@/components/DayDetailDialog";
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
  const [showingDay, setShowingDay] = useState<{
    day: Date;
    events: EventResponse[];
    isToday: boolean;
  } | null>(null);
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
          "grid gap-3 grid-cols-1 lg:gap-3 " +
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
          const isEmpty = visibleList.length === 0;
          const emptyMessage =
            list.length > 0 && isToday && prefs.hidePastEventsToday
              ? "Nothing left today"
              : "No events";

          return (
            <DayCard
              key={key}
              day={day}
              isToday={isToday}
              isEmpty={isEmpty}
              emptyMessage={emptyMessage}
              visibleList={visibleList}
              hiddenCount={list.length - visibleList.length}
              hidPastNote={Boolean(
                isToday &&
                  prefs.hidePastEventsToday &&
                  list.length > visibleList.length,
              )}
              timeFormat={prefs.timeFormat}
              isPastEvent={isPastEvent}
              onOpenDay={() =>
                setShowingDay({ day, events: visibleList, isToday })
              }
              onEditEvent={setEditing}
            />
          );
        })}
      </div>

      {editing && (
        <EventEditDialog event={editing} onClose={() => setEditing(null)} />
      )}

      {showingDay && !editing && (
        <DayDetailDialog
          day={showingDay.day}
          events={showingDay.events}
          isToday={showingDay.isToday}
          timeFormat={prefs.timeFormat}
          nowMs={nowMs}
          onClose={() => setShowingDay(null)}
          onEdit={(event) => {
            setShowingDay(null);
            setEditing(event);
          }}
        />
      )}
    </>
  );
}

function DayCard({
  day,
  isToday,
  isEmpty,
  emptyMessage,
  visibleList,
  hiddenCount,
  hidPastNote,
  timeFormat,
  isPastEvent,
  onOpenDay,
  onEditEvent,
}: {
  day: Date;
  isToday: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  visibleList: EventResponse[];
  hiddenCount: number;
  hidPastNote: boolean;
  timeFormat: "12h" | "24h";
  isPastEvent: (event: EventResponse) => boolean;
  onOpenDay: () => void;
  onEditEvent: (event: EventResponse) => void;
}) {
  const dateNum = day.getDate();
  const monthShort = day.toLocaleDateString(undefined, { month: "short" });
  const weekdayShort = formatWeekday(day).split(" ")[0]; // just "Thu"
  const ariaLabel =
    `${day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}` +
    `, ${visibleList.length} ${visibleList.length === 1 ? "event" : "events"}` +
    " — tap to view";

  return (
    <button
      type="button"
      onClick={onOpenDay}
      aria-label={ariaLabel}
      className={
        "group flex flex-col rounded-3xl border bg-surface-card p-5 text-left shadow-soft transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:h-72 lg:rounded-2xl lg:p-3 lg:shadow-none lg:active:scale-100 " +
        (isToday
          ? "border-brand/60 ring-1 ring-brand/30"
          : "border-divider hover:border-brand/40")
      }
    >
      {/* Mobile pass-style header: large date number + weekday/month;
          desktop falls back to the compact `Thu 8` overline + Today pill. */}
      <div className="flex shrink-0 items-start justify-between gap-3 lg:items-center">
        <div className="flex items-baseline gap-3 lg:gap-2">
          <span className="text-3xl font-semibold leading-none tracking-tight lg:hidden">
            {dateNum}
          </span>
          <div className="flex flex-col leading-tight lg:flex-row lg:items-baseline lg:gap-2">
            <span
              className={
                "text-xs uppercase tracking-[0.18em] " +
                (isToday ? "text-brand" : "text-ink-muted")
              }
            >
              <span className="lg:hidden">
                {day.toLocaleDateString(undefined, { weekday: "long" })}
              </span>
              <span className="hidden lg:inline">{weekdayShort}</span>
            </span>
            <span className="text-[11px] text-ink-subtle lg:hidden">
              {monthShort}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isToday && (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand">
              Today
            </span>
          )}
          {isEmpty && (
            <span className="text-xs text-ink-subtle lg:hidden">
              {emptyMessage}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      {isEmpty ? (
        <p className="mt-2 hidden text-xs text-ink-subtle lg:block">
          {emptyMessage}
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5 lg:mt-2 lg:space-y-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {visibleList.map((event) => (
            <EventPill
              key={event.id}
              event={event}
              timeFormat={timeFormat}
              past={isPastEvent(event)}
              onEdit={() => onEditEvent(event)}
            />
          ))}
        </ul>
      )}

      {!isEmpty && (
        <p className="mt-3 shrink-0 text-[11px] text-ink-muted lg:mt-1.5 lg:text-[10px] lg:text-ink-subtle">
          {visibleList.length} {visibleList.length === 1 ? "event" : "events"}
          {hidPastNote && (
            <span className="ml-1">· {hiddenCount} hidden</span>
          )}
          <span aria-hidden className="float-right text-ink-subtle lg:hidden">
            tap to expand →
          </span>
        </p>
      )}
    </button>
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
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      onClick={(e) => {
        // Let the outer day-card click open the modal on mobile.
        // On desktop, single-clicks here are no-ops; double-click edits.
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
        }
      }}
      role="button"
      tabIndex={0}
      className={
        "group flex cursor-pointer select-none items-center gap-1.5 rounded-md bg-surface px-1.5 py-1 text-xs ring-1 ring-divider/60 transition hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
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
