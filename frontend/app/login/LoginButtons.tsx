"use client";

import { useState, useTransition } from "react";

import { devLogin } from "./actions";

export function LoginButtons() {
  const apiBase = process.env.NEXT_PUBLIC_CHRONOS_API_URL ?? "http://localhost:8080";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onDev = () => {
    setError(null);
    startTransition(async () => {
      try {
        await devLogin();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div className="space-y-3">
      <a
        href={`${apiBase}/oauth2/authorization/google`}
        className="flex w-full items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
      >
        Continue with Google
      </a>

      <button
        onClick={onDev}
        disabled={isPending}
        className="w-full rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
      >
        Use the local dev account
      </button>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      <p className="text-xs text-zinc-500">
        Google sign-in only works when{" "}
        <code className="rounded bg-zinc-800 px-1">GOOGLE_CLIENT_ID</code> is
        set on the API. Without it, click the second button to use a stable
        dev user.
      </p>
    </div>
  );
}
