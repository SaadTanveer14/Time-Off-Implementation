import { setupWorker } from "msw/browser";
import { handlers } from "./hcm/handlers";

let worker: ReturnType<typeof setupWorker> | undefined;

export function getBrowserWorker() {
  if (!worker) {
    worker = setupWorker(...handlers);
  }
  return worker;
}

export async function startBrowserMsw(): Promise<void> {
  const w = getBrowserWorker();
  await w.start({
    onUnhandledRequest: "bypass",
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
  });
}
