import { LoginButtons } from "./LoginButtons";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-64 max-w-2xl rounded-full bg-brand/15 blur-3xl"
      />
      <div className="rounded-2xl border border-divider bg-surface-elevated p-8 shadow-soft">
        <h1 className="text-2xl font-semibold tracking-tight">Chronos</h1>
        <p className="mt-2 text-sm text-ink-muted">
          A modern personal planner. Talk to your week, share it as a feed, and
          keep everything on one screen.
        </p>

        <ErrorMessage searchParams={searchParams} />

        <div className="mt-8">
          <LoginButtons />
        </div>

        <p className="mt-6 text-xs text-ink-subtle">
          Calendar data lives in your own database — there is no Google
          Calendar sync. You can export it as an .ics feed any client can
          subscribe to.
        </p>
      </div>
    </main>
  );
}

async function ErrorMessage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  if (!params.error) return null;
  return (
    <p className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
      Sign-in failed ({params.error}). Try again?
    </p>
  );
}
