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
        className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-brand-fg shadow-soft transition hover:brightness-110"
      >
        Continue with Google
      </a>

      <button
        onClick={onDev}
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-xl border border-divider bg-surface-card px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-elevated disabled:opacity-50"
      >
        Use the local dev account
      </button>

      {error && <p className="text-xs text-danger">{error}</p>}

      <p className="text-xs text-ink-subtle">
        Google sign-in only works when{" "}
        <code className="rounded bg-surface-card px-1">GOOGLE_CLIENT_ID</code>{" "}
        is set on the API. Without it, click the second button to use a stable
        dev user.
      </p>
    </div>
  );
}
