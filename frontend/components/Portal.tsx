"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children into <body>. Modals use this to escape every ancestor's
 * stacking context — a sticky header with `backdrop-blur` would otherwise
 * box the modal's own backdrop-filter and the header would render
 * un-blurred through the dim layer.
 *
 * Mounted-state guard avoids SSR hitting `document` before hydration.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
