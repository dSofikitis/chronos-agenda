import { redirect } from "next/navigation";

import { NewEventForm } from "./NewEventForm";
import { WeekView } from "@/components/WeekView";
import { apiJson, ApiError } from "@/lib/apiClient";
import type { CurrentUser, EventResponse, TaskResponse } from "@/lib/types";
import { startOfWeek, endOfWeek } from "@/lib/week";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const me = await fetchMe();
  const now = new Date();
  // Server always works in Monday-anchored math; the user's `weekStart`
  // preference rotates the rendered grid client-side.
  const from = startOfWeek(now);
  const to = endOfWeek(now);

  const [events, tasks] = await Promise.all([
    apiJson<EventResponse[]>(
      `/api/events?from=${from.toISOString()}&to=${to.toISOString()}`,
    ).catch(() => []),
    apiJson<TaskResponse[]>("/api/tasks?status=open").catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-ink-subtle">
          {weekRangeLabel(from, to)}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Hi, {me.displayName.split(" ")[0]}.
        </h1>
        <p className="text-sm text-ink-muted">
          Here&apos;s your week. Use the floating assistant in the corner — or{" "}
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

function weekRangeLabel(from: Date, to: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const end = new Date(to.getTime() - 1);
  return `${from.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}
