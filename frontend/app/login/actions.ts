"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { apiBase, cookieName } from "@/lib/apiClient";

/**
 * Triggers the API's local-dev login, copies the response Set-Cookie into the
 * Next.js cookie jar so subsequent SSR requests see the session, then sends
 * the user to /agenda.
 */
export async function devLogin(): Promise<void> {
  const res = await fetch(apiBase + "/api/auth/dev-login", { method: "POST" });
  if (!res.ok) {
    throw new Error(`dev-login ${res.status}`);
  }
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const tokenMatch = setCookie.match(new RegExp(`${cookieName}=([^;]+)`));
    if (tokenMatch) {
      const jar = await cookies();
      jar.set({
        name: cookieName,
        value: tokenMatch[1],
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
    }
  }
  redirect("/agenda");
}
