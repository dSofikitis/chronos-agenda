import Link from "next/link";

import { apiJson } from "@/lib/apiClient";
import type { TaskResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const PRIORITY_LABEL = ["Low", "Normal", "High"];

export default async function TasksPage() {
  const tasks = await apiJson<TaskResponse[]>("/api/tasks?status=all").catch(
    () => [] as TaskResponse[],
  );
  const open = tasks.filter((t) => t.status === "open");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tasks</h1>
        <nav className="flex gap-3 text-sm text-zinc-400">
          <Link href="/agenda" className="hover:text-zinc-100">Agenda</Link>
          <Link href="/tasks" className="hover:text-zinc-100">Tasks</Link>
          <Link href="/settings" className="hover:text-zinc-100">Settings</Link>
        </nav>
      </header>

      <Section title={`Open (${open.length})`} tasks={open} />
      <Section title={`Done (${done.length})`} tasks={done} muted />
    </main>
  );
}

function Section({
  title,
  tasks,
  muted = false,
}: {
  title: string;
  tasks: TaskResponse[];
  muted?: boolean;
}) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </h2>
      <ul className="mt-3 space-y-2">
        {tasks.length === 0 && (
          <li className="text-sm text-zinc-500">Nothing here.</li>
        )}
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-baseline justify-between text-sm"
          >
            <span className={muted ? "text-zinc-500 line-through" : "text-zinc-200"}>
              {task.title}
            </span>
            <span className="text-xs text-zinc-500">
              {PRIORITY_LABEL[task.priority] ?? "?"}
              {task.dueBy && ` · ${new Date(task.dueBy).toLocaleDateString()}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
