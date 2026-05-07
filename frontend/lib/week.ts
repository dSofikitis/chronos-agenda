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

export function formatWeekday(d: Date, locale = "en-US"): string {
  return d.toLocaleDateString(locale, { weekday: "short", day: "numeric" });
}

/** Format an ISO datetime as HH:mm in the user's local zone. */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}
