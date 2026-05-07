import Link from "next/link";

import { addDays } from "@/lib/week";

interface Props {
  weekStart: Date;
  isCurrentWeek: boolean;
}

export function WeekNav({ weekStart, isCurrentWeek }: Props) {
  const prev = toIsoDate(addDays(weekStart, -7));
  const next = toIsoDate(addDays(weekStart, 7));

  return (
    <div className="flex items-center gap-1">
      <NavButton href={`/agenda?week=${prev}`} label="Previous week">
        <Chevron direction="left" />
      </NavButton>
      {!isCurrentWeek && (
        <Link
          href="/agenda"
          className="rounded-lg border border-divider bg-surface-card px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-surface-elevated hover:text-ink"
        >
          Today
        </Link>
      )}
      <NavButton href={`/agenda?week=${next}`} label="Next week">
        <Chevron direction="right" />
      </NavButton>
    </div>
  );
}

function NavButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-divider bg-surface-card text-ink-muted transition hover:bg-surface-elevated hover:text-ink"
    >
      {children}
    </Link>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="m15 18-6-6 6-6" />
      ) : (
        <path d="m9 6 6 6-6 6" />
      )}
    </svg>
  );
}

function toIsoDate(d: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
