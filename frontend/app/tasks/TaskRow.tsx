"use client";

import { useState, useTransition } from "react";

import { deleteTaskAction, toggleTaskAction } from "./actions";
import { CheckIcon, TrashIcon } from "@/components/icons";
import type { TaskResponse } from "@/lib/types";

const PRIORITY_LABEL = ["Low", "Normal", "High"];

export function TaskRow({ task }: { task: TaskResponse }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isDone = task.status === "done";

  const toggle = () => {
    setError(null);
    startTransition(async () => {
      try {
        await toggleTaskAction(task.id, isDone ? "open" : "done");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const remove = () => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteTaskAction(task.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <li className="flex flex-col gap-1 density-pad">
      <div className="flex items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={toggle}
          disabled={isPending}
          aria-label={isDone ? "Mark task open" : "Mark task done"}
          className={
            "flex size-5 shrink-0 items-center justify-center rounded-full border transition " +
            (isDone
              ? "border-brand bg-brand text-brand-fg"
              : "border-ink-subtle text-transparent hover:border-brand hover:text-brand")
          }
        >
          <CheckIcon width={12} height={12} />
        </button>

        <span
          className={
            "flex-1 truncate " +
            (isDone ? "text-ink-subtle line-through" : "text-ink")
          }
        >
          {task.title}
        </span>

        <span className="hidden text-xs text-ink-muted sm:inline">
          {PRIORITY_LABEL[task.priority] ?? "?"}
          {task.dueBy && ` · ${new Date(task.dueBy).toLocaleDateString()}`}
        </span>

        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          aria-label="Delete task"
          className="rounded-md p-1 text-ink-subtle transition hover:bg-danger/10 hover:text-danger disabled:opacity-50"
        >
          <TrashIcon width={14} height={14} />
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </li>
  );
}
