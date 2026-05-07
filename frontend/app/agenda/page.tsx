import Link from "next/link";
import { redirect } from "next/navigation";

import { ChatPanel } from "@/components/ChatPanel";
import { WeekView } from "@/components/WeekView";
import { apiJson, ApiError } from "@/lib/apiClient";
import type { CurrentUser, EventResponse, TaskResponse } from "@/lib/types";
import { startOfWeek, endOfWeek } from "@/lib/week";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const me = await fetchMe();
  const now = new Date();
  const from = startOfWeek(now);
  const to = endOfWeek(now);

  const [events, tasks] = await Promise.all([
    apiJson<EventResponse[]>(
      `/api/events?from=${from.toISOString()}&to=${to.toISOString()}`,
    ).catch(() => []),
    apiJson<TaskResponse[]>("/api/tasks?status=open").catch(() => []),
  ]);

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">This week</h1>
            <p className="text-xs text-zinc-500">
              Signed in as {me.displayName} · {me.email}
            </p>
          </div>
          <nav className="flex gap-3 text-sm text-zinc-400">
            <Link href="/agenda" className="hover:text-zinc-100">Agenda</Link>
            <Link href="/tasks" className="hover:text-zinc-100">Tasks</Link>
            <Link href="/settings" className="hover:text-zinc-100">Settings</Link>
          </nav>
        </header>

        <WeekView from={from.toISOString()} events={events} />

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Open tasks
          </h2>
          <ul className="mt-3 space-y-2">
            {tasks.length === 0 && (
              <li className="text-sm text-zinc-500">Nothing open.</li>
            )}
            {tasks.map((task) => (
              <li key={task.id} className="flex items-baseline justify-between text-sm">
                <span className="text-zinc-200">{task.title}</span>
                <span className="text-xs text-zinc-500">
                  {task.dueBy ? new Date(task.dueBy).toLocaleDateString() : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <aside>
        <ChatPanel />
      </aside>
    </main>
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
