/**
 * Per-day expansion of events for the week / day views.
 *
 * Rules:
 *   - An event flagged `allDay` is rendered in the all-day strip on every
 *     day it covers.
 *   - A timed event that spans more than one calendar day renders:
 *       * on its first day  — as a timed pill from `startsAt` to end-of-day
 *       * on middle days    — in the all-day strip (it's literally all day)
 *       * on its last day   — as a timed pill from start-of-day to `endsAt`
 *   - Single-day timed events render normally on their one day.
 *
 * Date comparisons are local: a UTC `startsAt` of 23:00 falls on whatever
 * the user's local calendar day is — that's what they're rendering for.
 */

import type { EventResponse } from "@/lib/types";
import { isSameDay } from "@/lib/week";

export interface EventSlice {
  event: EventResponse;
  /** True on the first day of the event. */
  isStart: boolean;
  /** True on the last day of the event. */
  isEnd: boolean;
  /** True when the event spans more than one calendar day. */
  isMultiDay: boolean;
}

export interface DayBucket {
  allDay: EventSlice[];
  timed: EventSlice[];
}

/** True if the slice should render in the all-day strip on `day`. */
export function isAllDayOnDate(event: EventResponse, day: Date): boolean {
  if (event.allDay) return true;
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  if (isSameDay(start, end)) return false;
  return !isSameDay(day, start) && !isSameDay(day, end);
}

export function sliceFor(event: EventResponse, day: Date): EventSlice {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  return {
    event,
    isStart: isSameDay(day, start),
    isEnd: isSameDay(day, end),
    isMultiDay: !isSameDay(start, end),
  };
}

/** Bucket the events that overlap `day` into all-day vs timed slices. */
export function eventsForDay(
  events: EventResponse[],
  day: Date,
): DayBucket {
  const allDay: EventSlice[] = [];
  const timed: EventSlice[] = [];
  const dayStart = startOfDay(day).getTime();
  const dayEnd = endOfDay(day).getTime();

  for (const event of events) {
    const s = new Date(event.startsAt).getTime();
    const e = new Date(event.endsAt).getTime();
    // Overlap test: event starts before day-end AND ends after day-start.
    if (s >= dayEnd) continue;
    if (e <= dayStart) continue;

    const slice = sliceFor(event, day);
    if (isAllDayOnDate(event, day)) {
      allDay.push(slice);
    } else {
      timed.push(slice);
    }
  }

  // All-day events sort by title (stable order across days), timed by start.
  allDay.sort((a, b) => a.event.title.localeCompare(b.event.title));
  timed.sort(
    (a, b) =>
      new Date(a.event.startsAt).getTime() -
      new Date(b.event.startsAt).getTime(),
  );

  return { allDay, timed };
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}
