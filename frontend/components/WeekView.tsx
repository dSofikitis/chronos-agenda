"use client";

import { useState } from "react";

import { DayDetailDialog } from "@/components/DayDetailDialog";
import { EventEditDialog } from "@/components/EventEditDialog";
import { addDays, formatWeekday, isSameDay, isWeekend } from "@/lib/week";
import { formatTime } from "@/lib/format";
import { eventsForDay, type EventSlice } from "@/lib/eventSlices";
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

  return (
    <>
      <div
        className={
          "grid gap-3 grid-cols-1 lg:gap-3 " +
          (prefs.hideWeekends ? "lg:grid-cols-5" : "lg:grid-cols-7")
        }
      >
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          const bucket = eventsForDay(events, day);

          // hidePastEventsToday filters today's already-finished events out
          // of both buckets. Past days keep theirs (rendered dim).
          const allDay =
            isToday && prefs.hidePastEventsToday
              ? bucket.allDay.filter((s) => !isPastEvent(s.event))
              : bucket.allDay;
          const timed =
            isToday && prefs.hidePastEventsToday
              ? bucket.timed.filter((s) => !isPastEvent(s.event))
              : bucket.timed;

          const totalRaw = bucket.allDay.length + bucket.timed.length;
          const totalShown = allDay.length + timed.length;
          const hiddenCount = totalRaw - totalShown;
          const isEmpty = totalShown === 0;
          const emptyMessage =
            totalRaw > 0 && isToday && prefs.hidePastEventsToday
              ? "Nothing left today"
              : "No events";

          // The DayDetailDialog wants the original events that overlap this
          // day, not the slices.
          const dayEvents = [
            ...bucket.allDay.map((s) => s.event),
            ...bucket.timed.map((s) => s.event),
          ];

          return (
            <DayCard
              key={day.toDateString()}
              day={day}
              isToday={isToday}
              isEmpty={isEmpty}
              emptyMessage={emptyMessage}
              allDay={allDay}
              timed={timed}
              hiddenCount={hiddenCount}
              hidPastNote={Boolean(
                isToday &&
                  prefs.hidePastEventsToday &&
                  hiddenCount > 0,
              )}
              timeFormat={prefs.timeFormat}
              isPastEvent={isPastEvent}
              onOpenDay={() =>
                setShowingDay({ day, events: dayEvents, isToday })
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
  allDay,
  timed,
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
  allDay: EventSlice[];
  timed: EventSlice[];
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
  const totalShown = allDay.length + timed.length;
  const ariaLabel =
    `${day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}` +
    `, ${totalShown} ${totalShown === 1 ? "event" : "events"}` +
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
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 lg:mt-2 lg:gap-1.5 lg:overflow-y-auto lg:pr-1">
          {allDay.length > 0 && (
            <ul className="space-y-1">
              {allDay.map((slice) => (
                <AllDayPill
                  key={slice.event.id}
                  slice={slice}
                  past={isPastEvent(slice.event)}
                  onEdit={() => onEditEvent(slice.event)}
                />
              ))}
            </ul>
          )}
          {allDay.length > 0 && timed.length > 0 && (
            <hr className="border-divider/60" aria-hidden />
          )}
          {timed.length > 0 && (
            <ul className="space-y-1">
              {timed.map((slice) => (
                <TimedPill
                  key={slice.event.id}
                  slice={slice}
                  timeFormat={timeFormat}
                  past={isPastEvent(slice.event)}
                  onEdit={() => onEditEvent(slice.event)}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {!isEmpty && (
        <p className="mt-3 shrink-0 text-[11px] text-ink-muted lg:mt-1.5 lg:text-[10px] lg:text-ink-subtle">
          {totalShown} {totalShown === 1 ? "event" : "events"}
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

/** Render an all-day event row — full-width, brand-tinted, with optional
 *  continuation chevrons when it spans into / from neighboring days. */
function AllDayPill({
  slice,
  past,
  onEdit,
}: {
  slice: EventSlice;
  past: boolean;
  onEdit: () => void;
}) {
  const { event, isStart, isEnd, isMultiDay } = slice;
  const continuesLeft = isMultiDay && !isStart;
  const continuesRight = isMultiDay && !isEnd;
  const tooltip = buildTooltip(event, slice, "all-day");

  return (
    <li
      title={tooltip}
      aria-label={tooltip}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      onClick={(e) => e.stopPropagation()}
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
        "group flex cursor-pointer select-none items-center gap-1.5 rounded-md bg-brand-soft px-1.5 py-1 text-xs text-brand transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
        (past ? "opacity-45 hover:opacity-80" : "")
      }
    >
      {continuesLeft ? (
        <span aria-hidden className="text-[10px] leading-none">◂</span>
      ) : (
        <span aria-hidden className="font-mono text-[10px] uppercase tracking-wide opacity-70">
          ALL
        </span>
      )}
      <span
        className={
          "truncate font-medium " + (past ? "line-through decoration-1" : "")
        }
      >
        {event.title}
      </span>
      {continuesRight && (
        <span aria-hidden className="ml-auto text-[10px] leading-none">
          ▸
        </span>
      )}
    </li>
  );
}

/** Render a single-day timed event, or the start / end day of a multi-day
 *  timed event. Middle days route to AllDayPill instead. */
function TimedPill({
  slice,
  timeFormat,
  past,
  onEdit,
}: {
  slice: EventSlice;
  timeFormat: "12h" | "24h";
  past: boolean;
  onEdit: () => void;
}) {
  const { event, isStart, isMultiDay } = slice;
  const tooltip = buildTooltip(event, slice, "timed", timeFormat);

  // Time chip semantics:
  //   single-day: HH:mm (start)
  //   multi-day start: HH:mm →
  //   multi-day end:   → HH:mm
  let timeChip: React.ReactNode;
  if (!isMultiDay) {
    timeChip = (
      <span className="font-mono text-[10px] tabular-nums text-ink-muted">
        {formatTime(event.startsAt, timeFormat)}
      </span>
    );
  } else if (isStart) {
    timeChip = (
      <span className="font-mono text-[10px] tabular-nums text-ink-muted">
        {formatTime(event.startsAt, timeFormat)} ▸
      </span>
    );
  } else {
    // isEnd
    timeChip = (
      <span className="font-mono text-[10px] tabular-nums text-ink-muted">
        ◂ {formatTime(event.endsAt, timeFormat)}
      </span>
    );
  }

  return (
    <li
      title={tooltip}
      aria-label={tooltip}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      onClick={(e) => e.stopPropagation()}
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
      {timeChip}
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

function buildTooltip(
  event: EventResponse,
  slice: EventSlice,
  kind: "all-day" | "timed",
  timeFormat?: "12h" | "24h",
): string {
  const parts: string[] = [event.title];
  if (kind === "all-day") {
    if (slice.isMultiDay) {
      const startDate = new Date(event.startsAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const endDate = new Date(event.endsAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      parts.push(`${startDate} → ${endDate}`);
    } else {
      parts.push("All day");
    }
  } else if (timeFormat) {
    if (slice.isMultiDay && slice.isStart) {
      parts.push(`From ${formatTime(event.startsAt, timeFormat)}`);
    } else if (slice.isMultiDay && slice.isEnd) {
      parts.push(`Until ${formatTime(event.endsAt, timeFormat)}`);
    } else {
      parts.push(
        `${formatTime(event.startsAt, timeFormat)}–${formatTime(event.endsAt, timeFormat)}`,
      );
    }
  }
  if (event.location) parts.push(event.location);
  parts.push("double-click to edit");
  return parts.join(" · ");
}
