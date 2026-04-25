"use client";

import { useToastQueueStore } from "@/state/toast-queue.store";
import { useDriftNotificationsStore } from "@/state/drift-notifications.store";
import { notificationLayer as copy } from "@/copy";

const toneClass: Record<string, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  info: "border-blue-200 bg-blue-50 text-blue-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  error: "border-rose-300 bg-rose-50 text-rose-950",
};

export function NotificationLayer() {
  const toasts = useToastQueueStore((s) => s.toasts);
  const dismissToast = useToastQueueStore((s) => s.dismiss);
  const drifts = useDriftNotificationsStore((s) => s.notifications);
  const dismissDrift = useDriftNotificationsStore((s) => s.dismiss);

  if (toasts.length === 0 && drifts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] flex max-w-sm flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto rounded-2xl border p-4 shadow-lg ${toneClass[t.kind] ?? toneClass.info}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide opacity-80">{t.kind}</p>
              <p className="mt-1 text-sm font-semibold">{t.title}</p>
              {t.body ? <p className="mt-1 text-xs opacity-90">{t.body}</p> : null}
            </div>
            <button
              type="button"
              aria-label={copy.dismissToast}
              onClick={() => dismissToast(t.id)}
              className="shrink-0 rounded-full p-1 text-current opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
      {drifts.map((d) => (
        <div
          key={d.id}
          role="status"
          className="pointer-events-auto rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950 shadow-lg"
        >
          <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700">{copy.driftEyebrow}</p>
          <p className="mt-1 font-medium">
            {d.locationName}: {d.delta > 0 ? "+" : ""}
            {d.delta}
            {d.category !== "unknown" ? ` (${d.category.replace(/_/g, " ")})` : ""}
          </p>
          <button
            type="button"
            onClick={() => dismissDrift(d.id)}
            className="mt-2 text-xs font-semibold text-violet-800 underline"
          >
            {copy.dismissDrift}
          </button>
        </div>
      ))}
    </div>
  );
}
