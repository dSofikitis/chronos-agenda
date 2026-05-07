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
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-ink-subtle">
          Things to do
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>
      </header>

      <NewTaskForm />

      <Section title={`Open (${open.length})`} tasks={open} />
      <Section title={`Done (${done.length})`} tasks={done} />
    </div>
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
    <section className="rounded-2xl border border-divider bg-surface-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </h2>
      <ul className="mt-3 divide-y divide-divider/60">
        {tasks.length === 0 && (
          <li className="density-pad text-sm text-ink-subtle">Nothing here.</li>
        )}
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </ul>
    </section>
  );
}
