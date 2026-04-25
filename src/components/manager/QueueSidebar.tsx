"use client";

import { cn, formatDateRange } from "@/lib/utils";
import type { PendingApproval } from "@/lib/types";

interface QueueSidebarProps {
  items: PendingApproval[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function QueueSidebar({ items, selectedId, onSelect }: QueueSidebarProps) {
  return (
    <aside>
      <p className="text-[12px] font-bold uppercase tracking-[1.5px] text-zinc-600">
        Next in queue
      </p>

      <ul className="mt-4 space-y-3">
        {items.map((req) => {
          const willHave = req.freshBalanceDays - req.days;
          const sufficient = willHave >= 0;
          const isSelected = req.id === selectedId;

          return (
            <li key={req.id}>
              <button
                type="button"
                onClick={() => onSelect(req.id)}
                className={cn(
                  "group w-full flex items-center gap-3 rounded-2xl border bg-white p-4 text-left transition-all hover:shadow-md",
                  isSelected
                    ? "border-violet-600 ring-2 ring-violet-100"
                    : "border-zinc-200",
                )}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: req.employeeAvatarColor }}
                >
                  <span className="text-xs font-bold text-violet-800">
                    {req.employeeName.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#0F0B1E]">
                    {req.employeeName}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {formatDateRange(req.startDate, req.endDate)} · {req.days}d ·{" "}
                    {req.locationName}
                  </p>
                  <span
                    className={cn(
                      "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      sufficient
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        sufficient ? "bg-emerald-500" : "bg-rose-500",
                      )}
                    />
                    {sufficient
                      ? `${req.freshBalanceDays}d avail.`
                      : `${req.freshBalanceDays}d avail · short`}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-base shrink-0 transition-colors",
                    isSelected ? "text-violet-600" : "text-zinc-300",
                  )}
                  aria-hidden
                >
                  →
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Info banner */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-violet-50 border border-violet-200 p-4">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="#7C3AED"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
          className="shrink-0 mt-0.5"
        >
          <circle cx="10" cy="10" r="8" />
          <path d="M10 6v4m0 3v0.5" />
        </svg>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-violet-800">
            Balance check is live
          </p>
          <p className="mt-1 text-[11px] text-violet-700">
            Each card re-reads HCM when you focus it.
          </p>
        </div>
      </div>
    </aside>
  );
}
