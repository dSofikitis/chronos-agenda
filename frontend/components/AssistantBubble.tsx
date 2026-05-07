"use client";

import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  clearAssistantHistoryAction,
  sendAssistantMessage,
  type ChatContext,
} from "@/app/_actions/assistant";
import {
  CloseIcon,
  CommandIcon,
  SendIcon,
  SparkleIcon,
  TrashIcon,
} from "@/components/icons";
import { usePreferences } from "@/components/PreferencesProvider";
import { addDays, startOfWeek } from "@/lib/week";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  backend?: string;
}

const SUGGESTIONS = [
  "Summarize my week",
  "Schedule a 30-minute focus block tomorrow at 9",
  "Reschedule Friday standup to 11am",
  "Add a task: prep slides, due Thursday",
];

export function AssistantBubble() {
  const { prefs } = usePreferences();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialogId = useId();

  // Cmd/Ctrl-K toggles the bubble. Esc closes.
  useEffect(() => {
    if (!prefs.assistantHotkey) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, prefs.assistantHotkey]);

  // Focus the input when the dialog opens.
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Click outside to dismiss.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const buildContext = useCallback((): ChatContext => {
    const weekParam = searchParams?.get("week");
    const monday = weekParam
      ? startOfWeek(new Date(weekParam))
      : startOfWeek(new Date());
    const sunday = addDays(monday, 6);
    return {
      visibleWeekStart: toIsoDate(monday),
      visibleWeekEnd: toIsoDate(sunday),
      hideWeekends: prefs.hideWeekends,
    };
  }, [searchParams, prefs.hideWeekends]);

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isPending) return;

      const userMsg: Message = { id: Date.now(), role: "user", text: trimmed };
      setMessages((m) => [...m, userMsg]);
      setDraft("");
      setError(null);

      const ctx = buildContext();

      startTransition(async () => {
        try {
          const reply = await sendAssistantMessage(trimmed, ctx);
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
    },
    [isPending, buildContext],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(draft);
  };

  const onClear = () => {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        await clearAssistantHistoryAction();
        setMessages([]);
        setDraft("");
        inputRef.current?.focus();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        aria-label="Open assistant"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => setOpen((v) => !v)}
        className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-fg shadow-bubble transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <SparkleIcon width={22} height={22} />
        <span className="sr-only">Toggle Chronos assistant</span>
      </button>

      {/* Popover dialog */}
      {open && (
        <div
          id={dialogId}
          role="dialog"
          aria-label="Chronos assistant"
          ref={dialogRef}
          className="fixed bottom-24 right-6 z-50 flex w-[min(420px,calc(100vw-2rem))] origin-bottom-right animate-bubble-pop flex-col overflow-hidden rounded-2xl border border-divider bg-surface-elevated text-ink shadow-bubble"
        >
          <header className="flex items-center justify-between gap-3 border-b border-divider px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand">
                <SparkleIcon width={14} height={14} />
              </span>
              <div>
                <p className="text-sm font-semibold leading-none">Assistant</p>
                <p className="mt-0.5 text-[11px] text-ink-subtle">
                  Talks to your calendar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onClear}
                aria-label="Clear conversation"
                title="Clear conversation"
                disabled={isPending}
                className="rounded-md p-1 text-ink-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-50"
              >
                <TrashIcon width={14} height={14} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="rounded-md p-1 text-ink-muted hover:bg-surface-card hover:text-ink"
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>
          </header>

          <div className="max-h-[55vh] flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <SuggestionList onPick={submit} disabled={isPending} />
            ) : (
              <ul className="space-y-3">
                {messages.map((msg) => (
                  <li
                    key={msg.id}
                    className={
                      msg.role === "user"
                        ? "ml-6 rounded-2xl rounded-tr-sm bg-brand px-3 py-2 text-sm text-brand-fg"
                        : "mr-6 rounded-2xl rounded-tl-sm border border-divider bg-surface-card px-3 py-2 text-sm text-ink"
                    }
                  >
                    {msg.role === "assistant" && msg.backend && (
                      <p className="mb-0.5 text-[10px] uppercase tracking-wide text-ink-subtle">
                        {msg.backend}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </li>
                ))}
                {isPending && (
                  <li className="mr-6 inline-flex items-center gap-1 rounded-2xl rounded-tl-sm border border-divider bg-surface-card px-3 py-2 text-ink-muted">
                    <span className="size-1.5 animate-pulse rounded-full bg-current" />
                    <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
                    <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
                  </li>
                )}
              </ul>
            )}
          </div>

          <form
            onSubmit={onSubmit}
            className="flex items-end gap-2 border-t border-divider bg-surface-card/60 px-3 py-3"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              placeholder="Ask the assistant…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(draft);
                }
              }}
              disabled={isPending}
              className="max-h-32 flex-1 resize-none rounded-xl bg-surface-input px-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none ring-1 ring-divider focus:ring-brand"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={isPending || !draft.trim()}
              className="flex size-9 items-center justify-center rounded-xl bg-brand text-brand-fg transition disabled:cursor-not-allowed disabled:opacity-40 hover:brightness-110"
            >
              <SendIcon width={16} height={16} />
            </button>
          </form>
          {error && (
            <p className="border-t border-divider bg-danger/5 px-4 py-2 text-xs text-danger">
              {error}
            </p>
          )}
          {prefs.assistantHotkey && (
            <p className="flex items-center justify-end gap-1 border-t border-divider bg-surface-card/60 px-3 py-1.5 text-[10px] text-ink-subtle">
              <CommandIcon width={11} height={11} className="-mt-px" />
              <span>K to toggle · Enter to send · Shift-Enter for newline</span>
            </p>
          )}
        </div>
      )}
    </>
  );
}

function SuggestionList({
  onPick,
  disabled,
}: {
  onPick: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted">
        Ask in plain English. The assistant will create, list, and edit
        events + tasks for you.
      </p>
      <ul className="space-y-1.5">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onPick(s)}
              disabled={disabled}
              className="w-full rounded-lg border border-divider bg-surface-card px-3 py-2 text-left text-xs text-ink hover:border-brand/50 hover:bg-brand-soft disabled:opacity-50"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function toIsoDate(d: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
