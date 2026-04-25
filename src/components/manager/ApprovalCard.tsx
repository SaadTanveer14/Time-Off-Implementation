"use client";

import { cn, formatDateRange, relativeTime } from "@/lib/utils";
import type { PendingApproval } from "@/lib/types";
import { approvalCard as copy, businessDaysLabel } from "@/copy";

interface ApprovalCardProps {
  request: PendingApproval;
  isOldest?: boolean;
  onApprove: () => void;
  onDeny: () => void;
  pending?: boolean;
}

export function ApprovalCard({
  request,
  isOldest,
  onApprove,
  onDeny,
  pending,
}: ApprovalCardProps) {
  const willHave = request.freshBalanceDays - request.days;
  const sufficient = willHave >= 0;

  return (
    <article className="rounded-3xl bg-white border border-zinc-200 p-8 shadow-[0_16px_40px_rgba(15,11,30,0.10)]">
      {/* Priority flag */}
      {isOldest && (
        <div className="flex items-center gap-2 mb-4">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-[11px] font-bold uppercase tracking-[1px] text-amber-800">
            {copy.oldestInQueue}
          </span>
          <span className="text-xs text-zinc-400">
            {copy.submittedPrefix} {relativeTime(request.submittedAt)}
          </span>
        </div>
      )}

      {/* Employee */}
      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: request.employeeAvatarColor }}
        >
          <span className="text-base font-bold text-violet-800">
            {request.employeeName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="text-2xl font-bold tracking-tight text-[#0F0B1E]">
            {request.employeeName}
          </h3>
          <p className="text-sm text-zinc-500">
            {request.employeeRole} · {copy.reportsToYou}
          </p>
        </div>
      </div>

      {/* Date hero */}
      <div className="mt-8">
        <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-violet-600">
          {copy.requestedDatesEyebrow}
        </p>
        <p className="mt-2 text-[44px] font-extrabold tracking-[-1px] text-[#0F0B1E] leading-none">
          {formatDateRange(request.startDate, request.endDate)}
        </p>
        <p className="mt-2 text-sm font-medium text-zinc-600">
          {businessDaysLabel(request.days)} · {request.locationName}
        </p>
      </div>

      {/* Note */}
      {request.note && (
        <div className="mt-6 rounded-2xl bg-[#FAFAF7] border border-zinc-200 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[1px] text-zinc-500">
            {copy.employeeNoteEyebrow}
          </p>
          <p className="mt-2 text-sm italic text-zinc-700">&quot;{request.note}&quot;</p>
        </div>
      )}

      {/* Fresh balance panel */}
      <div
        className={cn(
          "mt-6 rounded-2xl p-5 border-[1.5px]",
          sufficient
            ? "bg-emerald-50 border-emerald-500"
            : "bg-rose-50 border-rose-500",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 shrink-0 rounded-full flex items-center justify-center",
              sufficient ? "bg-emerald-500" : "bg-rose-500",
            )}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {sufficient ? (
                <polyline points="3,9 7,13 14,4" />
              ) : (
                <>
                  <line x1="9" y1="3" x2="9" y2="11" />
                  <line x1="9" y1="14" x2="9" y2="14.5" />
                </>
              )}
            </svg>
          </div>
          <div>
            <p
              className={cn(
                "text-[11px] font-bold uppercase tracking-[1.5px]",
                sufficient ? "text-emerald-800" : "text-rose-800",
              )}
            >
              {copy.freshBalanceEyebrow}{" "}
              {relativeTime(request.freshBalanceReadAt)}
            </p>
            <p
              className={cn(
                "mt-1 text-base font-bold",
                sufficient ? "text-emerald-900" : "text-rose-900",
              )}
            >
              {copy.freshBalanceSummary(
                request.freshBalanceDays,
                willHave,
                sufficient,
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onDeny}
          disabled={pending}
          className="rounded-full border-[1.5px] border-rose-600 bg-white px-8 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
        >
          {copy.deny}
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={pending}
          className={cn(
            "flex items-center gap-2 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 px-8 py-3 text-sm font-bold text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {pending ? (
            <>
              <Spinner /> {copy.committing}
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden
              >
                <polyline points="2,8 6,12 14,3" />
              </svg>
              {copy.approve}
            </>
          )}
        </button>
        <p className="ml-2 text-xs text-zinc-500 hidden sm:block">
          {copy.approveHint}
        </p>
      </div>
    </article>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
