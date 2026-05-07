import Link from "next/link";

import { NewTaskForm } from "./NewTaskForm";
import { TaskRow } from "./TaskRow";
import { apiJson } from "@/lib/apiClient";
import type { TaskResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

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

      <NewTaskForm />

      <Section title={`Open (${open.length})`} tasks={open} />
      <Section title={`Done (${done.length})`} tasks={done} />
    </main>
  );
}

function Section({
  title,
  tasks,
}: {
  title: string;
  tasks: TaskResponse[];
}) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </h2>
      <ul className="mt-3 divide-y divide-zinc-800/60">
        {tasks.length === 0 && (
          <li className="py-2 text-sm text-zinc-500">Nothing here.</li>
        )}
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </ul>
    </section>
  );
}
