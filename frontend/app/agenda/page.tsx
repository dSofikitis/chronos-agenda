import { redirect } from "next/navigation";

import { NewEventForm } from "./NewEventForm";
import { WeekNav } from "@/components/WeekNav";
import { WeekView } from "@/components/WeekView";
import { apiJson, ApiError } from "@/lib/apiClient";
import type { CurrentUser, EventResponse, TaskResponse } from "@/lib/types";
import { startOfWeek, endOfWeek, isSameDay } from "@/lib/week";

export const dynamic = "force-dynamic";

interface SearchParams {
  week?: string;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const me = await fetchMe();
  const params = await searchParams;
  const today = new Date();

  // ?week=YYYY-MM-DD selects which week to display. Anything off goes
  // back to "this week" — defending against bad URLs.
  const anchor = parseAnchor(params.week) ?? today;
  const from = startOfWeek(anchor);
  const to = endOfWeek(anchor);
  const isCurrent = isSameDay(from, startOfWeek(today));

  const [events, tasks] = await Promise.all([
    apiJson<EventResponse[]>(
      `/api/events?from=${from.toISOString()}&to=${to.toISOString()}`,
    ).catch(() => []),
    apiJson<TaskResponse[]>("/api/tasks?status=open").catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-subtle">
              Hi, {me.displayName.split(" ")[0]}.
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {weekHeading(from, to)}
            </h1>
          </div>
          <WeekNav weekStart={from} isCurrentWeek={isCurrent} />
        </div>
        <p className="text-sm text-ink-muted">
          {isCurrent
            ? "Here's your week. Use the floating assistant in the corner — or "
            : "Browsing a different week. Use the floating assistant — or "}
          <kbd className="rounded border border-divider bg-surface-card px-1 py-0.5 text-[11px]">
            ⌘K
          </kbd>{" "}
          — to talk through changes.
        </p>
      </header>

      <NewEventForm />

      <WeekView from={from.toISOString()} events={events} />

      <section className="rounded-2xl border border-divider bg-surface-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Open tasks
        </h2>
        {tasks.length === 0 ? (
          <p className="mt-3 text-sm text-ink-subtle">
            Nothing open. Add a task from the assistant or the Tasks tab.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-divider/60">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-baseline justify-between density-pad text-sm"
              >
                <span className="text-ink">{task.title}</span>
                <span className="text-xs text-ink-muted">
                  {task.dueBy
                    ? new Date(task.dueBy).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

async function fetchMe(): Promise<CurrentUser> {
  try {
    return await apiJson<CurrentUser>("/api/auth/me");
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      redirect("/login");
    }
    throw e;
  }
}

function parseAnchor(raw: string | undefined): Date | null {
  if (!raw) return null;
  // Accept YYYY-MM-DD (the format produced by the WeekNav links).
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.valueOf()) ? null : d;
}

function weekHeading(from: Date, to: Date): string {
  const fmt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const end = new Date(to.getTime() - 1);
  return `Week of ${from.toLocaleDateString(undefined, fmt)} – ${end.toLocaleDateString(undefined, fmt)}`;
}
