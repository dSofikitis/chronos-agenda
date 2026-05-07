"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Tiny GFM-flavored markdown renderer for assistant turns. The visual rules
 * live as plain CSS in app/globals.css under `.chat-md` — keeps this file
 * focused on overrides where react-markdown's default React tree needs
 * tweaking (e.g. links must open in a new tab, never trust the URL scheme).
 */
export function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="chat-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // Disallow raw HTML in model output; react-markdown's default already
        // sanitizes, but this disables any future plugin re-enabling it.
        skipHtml
        components={{
          a: ({ href, children, ...props }) => (
            <a
              {...props}
              href={isSafeHref(href) ? href : undefined}
              target="_blank"
              rel="noreferrer noopener"
            >
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

/** Allow http(s)/mailto only; block javascript:, data:, file:, etc. */
function isSafeHref(href: string | undefined): boolean {
  if (!href) return false;
  const trimmed = href.trim().toLowerCase();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#")
  );
}
