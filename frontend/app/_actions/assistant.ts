"use server";

import { revalidatePath } from "next/cache";

import { apiJson } from "@/lib/apiClient";
import type { AssistantReply } from "@/lib/types";

/** Tool-calls may have mutated events / tasks — always revalidate the views. */
export async function sendAssistantMessage(message: string): Promise<AssistantReply> {
  const reply = await apiJson<AssistantReply>("/api/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  revalidatePath("/agenda");
  revalidatePath("/tasks");
  return reply;
}
