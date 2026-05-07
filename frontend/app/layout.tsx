import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chronos Agenda",
  description: "Personal planner with a Claude-powered scheduling assistant.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
