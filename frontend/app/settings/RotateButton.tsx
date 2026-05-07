"use client";

import { useState, useTransition } from "react";

import { rotateIcsTokenAction } from "./actions";

export function RotateButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await rotateIcsTokenAction();
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            }
          });
        }}
        disabled={isPending}
        className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-1.5 text-sm font-medium text-danger transition hover:bg-danger/20 disabled:opacity-50"
      >
        {isPending ? "Rotating…" : "Rotate token"}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
