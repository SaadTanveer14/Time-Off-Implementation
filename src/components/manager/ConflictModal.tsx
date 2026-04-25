"use client";

import { useEffect } from "react";
import type { PendingApproval } from "@/lib/types";

interface ConflictModalProps {
  request: PendingApproval;
  /** The balance that was assumed when the manager clicked Approve */
  staleBalance: number;
  /** The freshly read balance at click time */
  liveBalance: number;
  /** Description of what changed (e.g., "Maya K. approved Jordan L.'s Apr 29 request") */
  changeDetail: string;
  onApproveAnyway: () => void;
  onDeny: () => void;
  onKeepPending: () => void;
}

export function ConflictModal({
  request,
  staleBalance,
  liveBalance,
  changeDetail,
  onApproveAnyway,
  onDeny,
  onKeepPending,
}: ConflictModalProps) {
  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const wasAfter = staleBalance - request.days;
  const nowAfter = liveBalance - request.days;
  const stillSafe = nowAfter >= 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F0B1E]/55 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
    >
      <div className="relative w-full max-w-[760px] overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Red banner header */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-800 px-10 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M10 2L2 18h16L10 2z" />
                <line x1="10" y1="8" x2="10" y2="12" />
                <circle cx="10" cy="15" r="0.5" fill="white" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-rose-100">
                Balance changed
              </p>
              <h2
                id="conflict-title"
                className="mt-1 text-2xl font-bold tracking-tight text-white"
              >
                Approve with current numbers?
              </h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-10 py-8">
          <p className="text-[15px] text-zinc-700 leading-relaxed">
            {request.employeeName.split(" ")[0]}'s balance just updated in HCM —
            another request was approved while this page was open. Please review
            the new numbers before committing.
          </p>

          {/* Comparison */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-stretch gap-4">
            {/* Was */}
            <div className="rounded-2xl bg-[#FAFAF7] border border-zinc-200 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-zinc-400">
                Was (2 min ago)
              </p>
              <p className="mt-3 text-[64px] font-extrabold tabular-nums leading-none text-zinc-400 line-through">
                {staleBalance}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Employee would have had
              </p>
              <p className="mt-1 text-base font-bold text-zinc-500">
                {wasAfter} days after approval
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden sm:flex items-center justify-center">
              <svg width="40" height="20" viewBox="0 0 40 20" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M2 10 H36 M28 2 L36 10 L28 18" />
              </svg>
            </div>

            {/* Now */}
            <div className="rounded-2xl bg-rose-50 border-2 border-rose-600 p-5 shadow-[0_8px_16px_rgba(220,38,38,0.25)]">
              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-rose-800">
                Now (live)
              </p>
              <p className="mt-3 text-[64px] font-extrabold tabular-nums leading-none text-rose-600">
                {liveBalance}
              </p>
              <p className="mt-2 text-xs text-rose-800">Request asks for</p>
              <p className="mt-1 text-base font-bold text-rose-800">
                {request.days} days → {nowAfter} left
              </p>
            </div>
          </div>

          {/* Change detail */}
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-violet-50 border border-violet-200 px-4 py-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#5B21B6" strokeWidth="2" strokeLinecap="round" aria-hidden className="mt-0.5 shrink-0">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 6v4l3 2" />
            </svg>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-800">
                Change detail
              </p>
              <p className="mt-1 text-sm text-violet-900">{changeDetail}</p>
            </div>
          </div>

          {/* Safe note */}
          {stillSafe && (
            <div className="mt-3 flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-500 px-4 py-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" aria-hidden className="mt-0.5 shrink-0">
                <polyline points="3,11 7,15 16,3" />
              </svg>
              <p className="text-sm font-medium text-emerald-900">
                Balance still covers the request — approval is safe to proceed,
                but {request.employeeName.split(" ")[0]} will have fewer days
                remaining.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onKeepPending}
              className="rounded-full border-[1.5px] border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              Keep pending
            </button>
            <button
              type="button"
              onClick={onDeny}
              className="rounded-full border-[1.5px] border-rose-600 bg-white px-6 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              Deny instead
            </button>
            <button
              type="button"
              onClick={onApproveAnyway}
              disabled={!stillSafe}
              className="ml-auto flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <polyline points="2,7 6,11 12,3" />
              </svg>
              Approve with new balance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
