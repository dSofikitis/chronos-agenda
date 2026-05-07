import { describe, expect, it } from "vitest";

import { addDays, endOfWeek, formatTime, startOfWeek } from "@/lib/week";

describe("week math", () => {
  it("startOfWeek snaps to Monday by default", () => {
    // Thursday 2026-05-07
    const start = startOfWeek(new Date("2026-05-07T14:30:00Z"));
    expect(start.getDay()).toBe(1); // Monday
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  it("endOfWeek is exactly seven days after startOfWeek", () => {
    const d = new Date("2026-05-09T00:00:00Z");
    const span = endOfWeek(d).getTime() - startOfWeek(d).getTime();
    expect(span).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("addDays handles month rollover", () => {
    const r = addDays(new Date("2026-05-30T00:00:00Z"), 5);
    expect(r.getDate()).toBe(4);
    expect(r.getMonth()).toBe(5);
  });

  it("formatTime zero-pads hours and minutes", () => {
    expect(formatTime("2026-05-07T03:05:00Z")).toMatch(/^\d{2}:\d{2}$/);
  });
});
