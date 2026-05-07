"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, apiJson } from "@/lib/apiClient";
import type { AssistantReply } from "@/lib/types";

export interface ChatContext {
  /** Inclusive — Monday of the week being viewed, ISO date `YYYY-MM-DD`. */
  visibleWeekStart?: string;
  /** Exclusive — Sunday-after-end, ISO date `YYYY-MM-DD`. */
  visibleWeekEnd?: string;
  hideWeekends?: boolean;
}

/** Tool-calls may have mutated events / tasks — always revalidate the views. */
export async function sendAssistantMessage(
  message: string,
  context: ChatContext = {},
): Promise<AssistantReply> {
  const reply = await apiJson<AssistantReply>("/api/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ message, ...context }),
  });
  revalidatePath("/agenda");
  revalidatePath("/tasks");
  return reply;
}

export async function clearAssistantHistoryAction(): Promise<{ deleted: number }> {
  const res = await apiFetch("/api/assistant/history", { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`clear chat ${res.status}`);
  }
  return (await res.json()) as { deleted: number };
}
