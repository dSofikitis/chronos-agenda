import { cookies } from "next/headers";

const API_BASE = process.env.CHRONOS_API_URL ?? "http://localhost:8080";
const COOKIE_NAME = process.env.CHRONOS_COOKIE_NAME ?? "chronos_session";

/**
 * Server-side fetch wrapper. Forwards the session cookie from the browser to
 * the API so the bearer token never appears in client JavaScript. Always call
 * from server components / actions / route handlers.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const jar = await cookies();
  const sessionCookie = jar.get(COOKIE_NAME);

  const headers = new Headers(init.headers);
  if (sessionCookie) {
    headers.set("Cookie", `${COOKIE_NAME}=${sessionCookie.value}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(API_BASE + path, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    throw new ApiError(res.status, await safeText(res));
  }
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`api ${status}: ${body.slice(0, 200)}`);
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export const apiBase = API_BASE;
export const cookieName = COOKIE_NAME;
