"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CalendarIcon, CogIcon, ListIcon, SparkleIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { href: "/agenda", label: "Agenda", Icon: CalendarIcon },
  { href: "/tasks", label: "Tasks", Icon: ListIcon },
  { href: "/settings", label: "Settings", Icon: CogIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const onAuthRoute = pathname === "/login" || pathname === "/";
  if (onAuthRoute) return <>{children}</>;

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="sticky top-0 z-20 border-b border-divider bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/agenda" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-brand-fg shadow-soft">
              <SparkleIcon width={14} height={14} />
            </span>
            <span className="text-sm font-semibold tracking-tight">Chronos</span>
          </Link>

          <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
            {NAV.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 transition " +
                    (active
                      ? "bg-brand-soft text-brand"
                      : "text-ink-muted hover:bg-surface-card hover:text-ink")
                  }
                >
                  <Icon width={14} height={14} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <ThemeToggle />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
