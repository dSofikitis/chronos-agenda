"use client";

import { useState, useTransition } from "react";

import { sendMessage } from "@/app/agenda/chat-actions";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  backend?: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isPending) return;

    const userMsg: Message = { id: Date.now(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setDraft("");
    setError(null);

    startTransition(async () => {
      try {
        const reply = await sendMessage(text);
        setMessages((m) => [
          ...m,
          {
            id: Date.now() + 1,
            role: "assistant",
            text: reply.text,
            backend: reply.backend,
          },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col rounded-lg border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Assistant
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Try: <em>summarize my week</em>, <em>schedule a 30-minute focus
          block tomorrow at 9</em>, <em>reschedule Friday standup to 11am</em>.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {messages.length === 0 && (
          <p className="text-xs text-zinc-600">
            Conversation will appear here.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.role === "user"
                ? "ml-8 rounded-lg bg-zinc-800 p-3"
                : "mr-8 rounded-lg border border-zinc-800 p-3"
            }
          >
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              {msg.role === "user" ? "you" : msg.backend ?? "assistant"}
            </div>
            <div className="mt-1 whitespace-pre-wrap text-zinc-200">
              {msg.text}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="mr-8 rounded-lg border border-zinc-800 p-3 text-zinc-500">
            …
          </div>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="border-t border-zinc-800 p-3"
      >
        {error && (
          <p className="mb-2 text-xs text-rose-400">{error}</p>
        )}
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask the assistant…"
            className="flex-1 rounded-md bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending || !draft.trim()}
            className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
