/**
 * Starts MSW on the Node.js runtime so RSC `prefetchQuery` + `fetch` to HCM are
 * intercepted the same way as in the browser worker. SSR hydration depends on
 * this when `NEXT_PUBLIC_USE_MSW=true` (see plan/CHALLENGES.md — two targets).
 */
let mswNodeStarted = false;

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PUBLIC_USE_MSW !== "true") return;
  if (mswNodeStarted) return;

  const { server } = await import("@/mocks/server");
  server.listen({ onUnhandledRequest: "bypass" });
  mswNodeStarted = true;
}
