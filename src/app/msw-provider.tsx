"use client";

import { useEffect, useRef } from "react";

/**
 * Starts the MSW service worker in the browser when `NEXT_PUBLIC_USE_MSW=true`.
 * Dynamic import keeps the worker out of the server bundle.
 */
export function MswProvider({ children }: { children: React.ReactNode }) {
  const started = useRef(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MSW !== "true") return;
    if (started.current) return;
    started.current = true;
    void import("@/mocks/browser")
      .then(({ startBrowserMsw }) => startBrowserMsw())
      .catch((err) => {
        console.error("[msw] failed to start worker", err);
      });
  }, []);

  return children;
}
