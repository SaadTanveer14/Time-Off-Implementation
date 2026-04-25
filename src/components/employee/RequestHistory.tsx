"use client";

import { cn, formatDateRange } from "@/lib/utils";
import type { TimeOffRequest, RequestStatus } from "@/lib/types";
import { history as copy, daysLabel } from "@/copy";

interface RequestHistoryProps {
  requests: TimeOffRequest[];
  onCancel: (id: string) => void;
}

export function RequestHistory({ requests, onCancel }: RequestHistoryProps) {
  return (
    <section className="rounded-3xl bg-white border border-zinc-200 p-8 shadow-[0_8px_16px_rgba(15,11,30,0.06)]">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-violet-600">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0F0B1E]">
            {copy.title}
          </h2>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
          {copy.totalBadge(requests.length)}
        </span>
      </header>

      <ul className="space-y-3">
        {requests.length === 0 && (
          <li className="rounded-2xl bg-zinc-50 border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
            {copy.empty}
          </li>
        )}
        {requests.map((req) => (
          <RequestRow key={req.id} request={req} onCancel={onCancel} />
        ))}
      </ul>
    </section>
  );
}

function RequestRow({
  request,
  onCancel,
}: {
  request: TimeOffRequest;
  onCancel: (id: string) => void;
}) {
  const isCancellable = request.status === "pending" || request.status === "submitting";
  return (
    <li
      className={cn(
        "group flex items-center gap-4 rounded-2xl border p-4 transition-colors",
        request.optimistic
          ? "border-2 border-dashed border-violet-400 bg-violet-50"
          : "border-zinc-200 bg-white hover:bg-zinc-50",
      )}
    >
      <StatusDot status={request.status} optimistic={request.optimistic} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm font-bold text-[#0F0B1E]">
            {formatDateRange(request.startDate, request.endDate)}
          </p>
          <span className="text-xs text-zinc-400">·</span>
          <p className="text-xs font-medium text-zinc-500">
            {daysLabel(request.days)}
          </p>
        </div>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {request.locationName}
          {request.note && <span className="text-zinc-400"> — “{request.note}”</span>}
        </p>
      </div>

      <StatusPill status={request.status} optimistic={request.optimistic} />

      {isCancellable && (
        <button
          type="button"
          onClick={() => onCancel(request.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-700 hover:border-rose-300 hover:text-rose-700"
        >
          {copy.cancel}
        </button>
      )}
    </li>
  );
}

function StatusDot({
  status,
  optimistic,
}: {
  status: RequestStatus;
  optimistic?: boolean;
}) {
  const map: Record<RequestStatus, string> = {
    submitting: "bg-violet-500 animate-pulse",
    pending: "bg-amber-500 animate-pulse",
    approved: "bg-emerald-500",
    denied: "bg-rose-500",
    cancelled: "bg-zinc-300",
  };
  return (
    <div
      aria-hidden
      className={cn(
        "h-2.5 w-2.5 shrink-0 rounded-full",
        map[status],
        optimistic && "ring-2 ring-violet-200",
      )}
    />
  );
}

function StatusPill({
  status,
  optimistic,
}: {
  status: RequestStatus;
  optimistic?: boolean;
}) {
  if (optimistic && status === "submitting") {
    return (
      <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-800">
        {copy.statusSubmitting}
      </span>
    );
  }
  const map: Record<RequestStatus, { label: string; cls: string }> = {
    submitting: {
      label: copy.statusSubmitting,
      cls: "bg-violet-100 text-violet-800",
    },
    pending: { label: copy.statusPending, cls: "bg-amber-100 text-amber-800" },
    approved: { label: copy.statusApproved, cls: "bg-emerald-100 text-emerald-800" },
    denied: { label: copy.statusDenied, cls: "bg-rose-100 text-rose-800" },
    cancelled: { label: copy.statusCancelled, cls: "bg-zinc-100 text-zinc-600" },
  };
  const { label, cls } = map[status];
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        cls,
      )}
    >
      {label}
    </span>
  );
}
