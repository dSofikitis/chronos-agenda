import { LoginButtons } from "./LoginButtons";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold">Chronos Agenda</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Personal planner with a Claude-powered assistant. Sign in to start
          organizing your week.
        </p>

        <ErrorMessage searchParams={searchParams} />

        <div className="mt-8">
          <LoginButtons />
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          By signing in you agree that calendar data lives in this server&apos;s
          database. There is no Google Calendar sync — Chronos is the source of
          truth.
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
    <p className="mt-4 rounded border border-rose-700 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
      Sign-in failed ({params.error}). Try again?
    </p>
  );
}
