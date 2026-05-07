"use server";

import { revalidatePath } from "next/cache";

import { apiJson } from "@/lib/apiClient";
import type { IcsUrl } from "@/lib/types";

export async function rotateIcsTokenAction(): Promise<IcsUrl> {
  const next = await apiJson<IcsUrl>("/api/ics/rotate", { method: "POST" });
  revalidatePath("/settings");
  return next;
}
