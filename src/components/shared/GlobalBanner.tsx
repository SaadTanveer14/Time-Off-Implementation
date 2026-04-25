"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useCircuitBreakerStore } from "@/state/circuit-breaker.store";
import { useDriftNotificationsStore } from "@/state/drift-notifications.store";
import { globalBanner as copy } from "@/copy";

function subscribeOnline(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

function getOnlineSnapshot(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function getServerOnlineSnapshot(): boolean {
  return true;
}

export function GlobalBanner() {
  const online = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerOnlineSnapshot);
  const circuitState = useCircuitBreakerStore((s) => s.state);
  /** Select the store array only — `.filter()` in the selector returns a new ref every run and causes an infinite render loop with useSyncExternalStore. */
  const driftNotifications = useDriftNotificationsStore((s) => s.notifications);
  const yearStartRows = useMemo(
    () => driftNotifications.filter((n) => n.category === "year_start_reset"),
    [driftNotifications],
  );

  const dismissYearStart = useCallback(() => {
    const { notifications, dismiss } = useDriftNotificationsStore.getState();
    for (const n of notifications.filter((x) => x.category === "year_start_reset")) {
      dismiss(n.id);
    }
  }, []);

  if (!online) {
    return (
      <div
        role="status"
        className="w-full bg-amber-100 border-b border-amber-300 px-6 py-2 text-center text-sm font-medium text-amber-950"
      >
        {copy.offline}
      </div>
    );
  }

  if (circuitState === "open") {
    return (
      <div
        role="status"
        className="w-full bg-orange-100 border-b border-orange-300 px-6 py-2 text-center text-sm font-medium text-orange-950"
      >
        {copy.circuitOpen}
      </div>
    );
  }

  if (yearStartRows.length > 0) {
    return (
      <div className="w-full bg-blue-50 border-b border-blue-200 px-6 py-2 flex flex-wrap items-center justify-center gap-3 text-sm text-blue-950">
        <p role="status" className="font-medium">
          {copy.yearStart}
        </p>
        <button
          type="button"
          onClick={dismissYearStart}
          className="rounded-full border border-blue-300 bg-white px-3 py-1 text-xs font-semibold text-blue-900 hover:bg-blue-100"
        >
          {copy.dismissYearStart}
        </button>
      </div>
    );
  }

  return null;
}
