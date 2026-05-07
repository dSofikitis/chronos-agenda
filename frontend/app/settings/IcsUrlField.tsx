"use client";

import { useState } from "react";

import { CheckIcon } from "@/components/icons";

export function IcsUrlField({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard API can fail on insecure origins; user can still select manually */
    }
  };

  return (
    <div className="flex items-stretch gap-2">
      <input
        readOnly
        value={url}
        placeholder="No feed URL yet"
        onClick={(e) => e.currentTarget.select()}
        className="flex-1 rounded-xl bg-surface-input px-3 py-2 font-mono text-xs text-ink outline-none ring-1 ring-divider"
      />
      <button
        type="button"
        onClick={onCopy}
        disabled={!url}
        aria-label="Copy feed URL"
        className="inline-flex items-center gap-1.5 rounded-xl border border-divider bg-surface-card px-3 py-2 text-xs font-medium text-ink hover:bg-surface-elevated disabled:opacity-50"
      >
        {copied ? (
          <>
            <CheckIcon width={12} height={12} /> Copied
          </>
        ) : (
          "Copy"
        )}
      </button>
    </div>
  );
}
