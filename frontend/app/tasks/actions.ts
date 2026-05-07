"use server";

import { revalidatePath } from "next/cache";

import { apiJson } from "@/lib/apiClient";
import type { TaskResponse } from "@/lib/types";

export interface CreateTaskInput {
  title: string;
  dueBy?: string;
  priority?: number;
  notes?: string;
}

export async function createTaskAction(
  input: CreateTaskInput,
): Promise<TaskResponse> {
  const body: Record<string, unknown> = { title: input.title };
  if (input.dueBy) body.dueBy = input.dueBy;
  if (typeof input.priority === "number") body.priority = input.priority;
  if (input.notes) body.notes = input.notes;

  const created = await apiJson<TaskResponse>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(body),
  });
  revalidatePath("/tasks");
  revalidatePath("/agenda");
  return created;
}

export async function toggleTaskAction(
  id: string,
  status: "open" | "done",
): Promise<TaskResponse> {
  const updated = await apiJson<TaskResponse>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  revalidatePath("/tasks");
  revalidatePath("/agenda");
  return updated;
}

export async function deleteTaskAction(id: string): Promise<void> {
  await apiJson<void>(`/api/tasks/${id}`, { method: "DELETE" });
  revalidatePath("/tasks");
  revalidatePath("/agenda");
}
