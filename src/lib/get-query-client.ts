import type { QueryClient } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query-client";

let browserQueryClient: QueryClient | undefined;

/**
 * Next.js App Router pattern: a fresh QueryClient per RSC request on the server,
 * a stable singleton on the browser so `HydrationBoundary` merges into the same
 * cache that `QueryClientProvider` exposes to hooks.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
