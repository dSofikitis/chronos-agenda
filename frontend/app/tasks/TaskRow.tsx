"use client";

import { useState, useTransition } from "react";

import { deleteTaskAction, toggleTaskAction } from "./actions";
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
    <li className="flex flex-col gap-1 py-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <label className="flex flex-1 items-center gap-2">
          <input
            type="checkbox"
            checked={isDone}
            onChange={toggle}
            disabled={isPending}
            className="size-4 cursor-pointer accent-zinc-100"
          />
          <span className={isDone ? "text-zinc-500 line-through" : "text-zinc-200"}>
            {task.title}
          </span>
        </label>
        <span className="text-xs text-zinc-500">
          {PRIORITY_LABEL[task.priority] ?? "?"}
          {task.dueBy && ` · ${new Date(task.dueBy).toLocaleDateString()}`}
        </span>
        <button
          onClick={remove}
          disabled={isPending}
          aria-label="Delete task"
          className="rounded text-xs text-zinc-600 hover:text-rose-300 disabled:opacity-50"
        >
          ×
        </button>
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </li>
  );
}
