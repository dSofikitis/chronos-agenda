"use server";

import { revalidatePath } from "next/cache";

import { apiJson } from "@/lib/apiClient";
import type { AssistantReply } from "@/lib/types";

export async function sendMessage(message: string): Promise<AssistantReply> {
  const reply = await apiJson<AssistantReply>("/api/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  // The assistant may have mutated events / tasks via tool-calls — re-fetch
  // the agenda the next time it's rendered.
  revalidatePath("/agenda");
  return reply;
}
