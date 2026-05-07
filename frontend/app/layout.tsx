import "./globals.css";

import type { Metadata } from "next";
import { Suspense } from "react";

import { AppShell } from "@/components/AppShell";
import { AssistantBubble } from "@/components/AssistantBubble";
import {
  NO_FLASH_SCRIPT,
  PreferencesProvider,
} from "@/components/PreferencesProvider";

export const metadata: Metadata = {
  title: "Chronos Agenda",
  description:
    "A modern personal planner with a Claude- or Gemini-powered scheduling assistant.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://rsms.me/"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <script
          // Synchronously sets the theme + density classes so the page
          // doesn't flash between light → dark on hard reloads.
          dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <PreferencesProvider>
          <AppShell>{children}</AppShell>
          {/* Suspense boundary keeps the search-params hook inside the bubble
              from forcing every static page (e.g. /_not-found) into dynamic
              rendering at build time. */}
          <Suspense fallback={null}>
            <AssistantBubble />
          </Suspense>
        </PreferencesProvider>
      </body>
    </html>
  );
}
