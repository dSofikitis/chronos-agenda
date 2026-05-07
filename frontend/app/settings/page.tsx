import Link from "next/link";

import { RotateButton } from "./RotateButton";
import { apiJson } from "@/lib/apiClient";
import type { CurrentUser, IcsUrl } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [me, ics] = await Promise.all([
    apiJson<CurrentUser>("/api/auth/me"),
    apiJson<IcsUrl>("/api/ics/url").catch(() => ({ url: "" })),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Settings</h1>
        <nav className="flex gap-3 text-sm text-zinc-400">
          <Link href="/agenda" className="hover:text-zinc-100">Agenda</Link>
          <Link href="/tasks" className="hover:text-zinc-100">Tasks</Link>
          <Link href="/settings" className="hover:text-zinc-100">Settings</Link>
        </nav>
      </header>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Account
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Display name" value={me.displayName} />
          <Row label="Email" value={me.email} />
          <Row label="Timezone" value={me.timezone} />
        </dl>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Calendar feed (.ics)
        </h2>
        <p className="mt-2 text-xs text-zinc-500">
          Subscribe with this URL from Apple Calendar / Google Calendar /
          Thunderbird to follow your Chronos schedule. Read-only. Rotating
          invalidates any subscribed clients.
        </p>
        <input
          readOnly
          value={ics.url}
          className="mt-3 w-full rounded-md bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-300 ring-1 ring-zinc-800"
        />
        <div className="mt-3">
          <RotateButton />
        </div>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-200">{value}</dd>
    </div>
  );
}
