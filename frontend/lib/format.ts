/** Formatting helpers shared across pages. */

import type { TimeFormat } from "@/lib/preferences";

export function formatTime(iso: string, fmt: TimeFormat = "24h"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  if (fmt === "12h") {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}
