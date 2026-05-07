import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/apiClient";

export const dynamic = "force-dynamic";

export default async function Root() {
  const res = await apiFetch("/api/auth/me").catch(() => null);
  if (res && res.ok) {
    redirect("/agenda");
  }
  redirect("/login");
}
