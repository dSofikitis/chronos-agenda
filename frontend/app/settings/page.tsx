import { AppearanceSettings } from "./AppearanceSettings";
import { CalendarSettings } from "./CalendarSettings";
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
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-ink-subtle">
          Preferences live in your browser
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      </header>

      <section className="rounded-2xl border border-divider bg-surface-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Account
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Display name" value={me.displayName} />
          <Row label="Email" value={me.email} />
          <Row label="Server timezone" value={me.timezone} />
        </dl>
      </section>

      <AppearanceSettings />
      <CalendarSettings />

      <section className="rounded-2xl border border-divider bg-surface-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Calendar feed
        </h2>
        <p className="mt-2 text-xs text-ink-subtle">
          Subscribe with this URL from Apple Calendar / Google Calendar /
          Thunderbird. Read-only. Rotating invalidates any subscribed clients.
        </p>
        <input
          readOnly
          value={ics.url}
          onClick={(e) => e.currentTarget.select()}
          className="mt-3 w-full rounded-xl bg-surface-input px-3 py-2 font-mono text-xs text-ink outline-none ring-1 ring-divider"
        />
        <div className="mt-3">
          <RotateButton />
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
