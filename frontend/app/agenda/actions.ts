"use server";

import { revalidatePath } from "next/cache";

import { apiJson } from "@/lib/apiClient";
import type { EventResponse } from "@/lib/types";

export interface CreateEventInput {
  title: string;
  startsAt: string;
  endsAt: string;
  allDay?: boolean;
  location?: string;
  notes?: string;
}

export interface UpdateEventInput {
  title?: string;
  startsAt?: string;
  endsAt?: string;
  allDay?: boolean;
  location?: string;
  notes?: string;
}

export async function createEventAction(
  input: CreateEventInput,
): Promise<EventResponse> {
  const created = await apiJson<EventResponse>("/api/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
  revalidatePath("/agenda");
  return created;
}

export async function updateEventAction(
  id: string,
  input: UpdateEventInput,
): Promise<EventResponse> {
  const updated = await apiJson<EventResponse>(`/api/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  revalidatePath("/agenda");
  return updated;
}

export async function deleteEventAction(id: string): Promise<void> {
  await apiJson<void>(`/api/events/${id}`, { method: "DELETE" });
  revalidatePath("/agenda");
}
