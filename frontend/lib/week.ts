/** Pure helpers for the week-view date math. No DOM, no fetches. */

export function startOfWeek(d: Date, weekStartsOn: 0 | 1 = 1): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const day = (out.getDay() - weekStartsOn + 7) % 7;
  out.setDate(out.getDate() - day);
  return out;
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function endOfWeek(d: Date, weekStartsOn: 0 | 1 = 1): Date {
  return addDays(startOfWeek(d, weekStartsOn), 7);
}

export function formatWeekday(d: Date, locale?: string): string {
  return d.toLocaleDateString(locale, { weekday: "short", day: "numeric" });
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Re-exported for tests; canonical implementation lives in lib/format.ts. */
export { formatTime } from "./format";
