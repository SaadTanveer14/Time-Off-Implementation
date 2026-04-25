"use client";

import { toast as copy } from "@/copy";

interface AnniversaryToastProps {
  locationName: string;
  daysAdded: number;
  onDismiss: () => void;
}

export function AnniversaryToast({
  locationName,
  daysAdded,
  onDismiss,
}: AnniversaryToastProps) {
  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-4 rounded-2xl bg-[#0F0B1E] p-4 pr-5 shadow-2xl ring-1 ring-amber-500/30 max-w-sm animate-[fadeIn_0.3s_ease-out]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="#F59E0B"
          aria-hidden
        >
          <path d="M11 2l1.6 5.4L18 9l-5.4 1.6L11 16l-1.6-5.4L4 9l5.4-1.6z" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-amber-400">
          {copy.anniversaryEyebrow}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-white">
          {copy.anniversaryBody(daysAdded, locationName)}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={copy.dismissAria}
        className="text-zinc-400 hover:text-white"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 3l10 10M13 3L3 13" />
        </svg>
      </button>
    </div>
  );
}

export function UndoToast({
  message,
  onUndo,
  remaining,
}: {
  message: string;
  onUndo: () => void;
  remaining: number;
}) {
  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-4 rounded-2xl bg-[#1E1B3F] p-3 pl-5 ring-1 ring-violet-600 shadow-2xl"
    >
      <p className="text-sm text-zinc-200">{message}</p>
      <button
        type="button"
        onClick={onUndo}
        className="rounded-full bg-violet-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-violet-500"
      >
        {copy.undoButton(remaining)}
      </button>
    </div>
  );
}
