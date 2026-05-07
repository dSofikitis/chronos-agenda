import { describe, expect, it } from "vitest";

import { eventsForDay, isAllDayOnDate, sliceFor } from "@/lib/eventSlices";
import type { EventResponse } from "@/lib/types";

const ev = (overrides: Partial<EventResponse>): EventResponse => ({
  id: "test",
  title: "Test",
  startsAt: "2026-05-07T10:00:00.000Z",
  endsAt: "2026-05-07T11:00:00.000Z",
  allDay: false,
  location: null,
  notes: null,
  ...overrides,
});

describe("isAllDayOnDate", () => {
  it("flagged all-day → always all-day", () => {
    const e = ev({ allDay: true });
    expect(isAllDayOnDate(e, new Date(2026, 4, 7))).toBe(true);
  });

  it("single-day timed → timed", () => {
    const e = ev({});
    expect(isAllDayOnDate(e, new Date(2026, 4, 7))).toBe(false);
  });

  it("multi-day timed: middle days are all-day, ends are timed", () => {
    const e = ev({
      startsAt: "2026-05-05T18:00:00.000Z",
      endsAt: "2026-05-08T09:00:00.000Z",
    });
    expect(isAllDayOnDate(e, new Date(2026, 4, 6))).toBe(true);
    expect(isAllDayOnDate(e, new Date(2026, 4, 7))).toBe(true);
    expect(isAllDayOnDate(e, new Date(2026, 4, 5))).toBe(false);
    expect(isAllDayOnDate(e, new Date(2026, 4, 8))).toBe(false);
  });
});

describe("sliceFor", () => {
  it("sets isStart / isEnd / isMultiDay correctly", () => {
    const e = ev({
      startsAt: "2026-05-05T18:00:00.000Z",
      endsAt: "2026-05-08T09:00:00.000Z",
    });
    const startSlice = sliceFor(e, new Date(2026, 4, 5));
    expect(startSlice.isStart).toBe(true);
    expect(startSlice.isEnd).toBe(false);
    expect(startSlice.isMultiDay).toBe(true);

    const middleSlice = sliceFor(e, new Date(2026, 4, 6));
    expect(middleSlice.isStart).toBe(false);
    expect(middleSlice.isEnd).toBe(false);

    const endSlice = sliceFor(e, new Date(2026, 4, 8));
    expect(endSlice.isStart).toBe(false);
    expect(endSlice.isEnd).toBe(true);
  });

  it("a single-day event reports isStart && isEnd && !isMultiDay", () => {
    const e = ev({});
    const slice = sliceFor(e, new Date(2026, 4, 7));
    expect(slice.isStart).toBe(true);
    expect(slice.isEnd).toBe(true);
    expect(slice.isMultiDay).toBe(false);
  });
});

describe("eventsForDay", () => {
  it("splits all-day and timed events", () => {
    const events = [
      ev({
        id: "vacation",
        allDay: true,
        startsAt: "2026-05-07T00:00:00.000Z",
        endsAt: "2026-05-07T23:59:59.000Z",
      }),
      ev({
        id: "standup",
        startsAt: "2026-05-07T08:00:00.000Z",
        endsAt: "2026-05-07T08:30:00.000Z",
      }),
    ];
    const { allDay, timed } = eventsForDay(events, new Date(2026, 4, 7));
    expect(allDay.map((s) => s.event.id)).toEqual(["vacation"]);
    expect(timed.map((s) => s.event.id)).toEqual(["standup"]);
  });

  it("multi-day timed event appears on every day it spans", () => {
    const events = [
      ev({
        id: "trip",
        startsAt: "2026-05-05T18:00:00.000Z",
        endsAt: "2026-05-08T09:00:00.000Z",
      }),
    ];
    expect(eventsForDay(events, new Date(2026, 4, 5)).timed.length).toBe(1);
    expect(eventsForDay(events, new Date(2026, 4, 6)).allDay.length).toBe(1);
    expect(eventsForDay(events, new Date(2026, 4, 7)).allDay.length).toBe(1);
    expect(eventsForDay(events, new Date(2026, 4, 8)).timed.length).toBe(1);
    expect(eventsForDay(events, new Date(2026, 4, 9)).allDay.length).toBe(0);
    expect(eventsForDay(events, new Date(2026, 4, 9)).timed.length).toBe(0);
  });

  it("timed events sort by startsAt", () => {
    const events = [
      ev({ id: "late", startsAt: "2026-05-07T15:00:00.000Z", endsAt: "2026-05-07T16:00:00.000Z" }),
      ev({ id: "early", startsAt: "2026-05-07T08:00:00.000Z", endsAt: "2026-05-07T09:00:00.000Z" }),
    ];
    const { timed } = eventsForDay(events, new Date(2026, 4, 7));
    expect(timed.map((s) => s.event.id)).toEqual(["early", "late"]);
  });
});
