"use client";

import { cn, relativeTime } from "@/lib/utils";
import type { Balance } from "@/lib/types";
import { StateBadge } from "@/components/shared/StateBadge";

interface BalanceCardProps {
  balance: Balance;
  size?: "hero" | "default" | "compact";
}

export function BalanceCard({ balance, size = "default" }: BalanceCardProps) {
  const { state } = balance;

  if (state === "loading") return <LoadingCard size={size} />;
  if (state === "error") return <ErrorCard balance={balance} size={size} />;
  if (state === "anniversary-bonus")
    return <AnniversaryCard balance={balance} size={size} />;
  if (state === "reconciled")
    return <ReconciledCard balance={balance} size={size} />;

  const isHero = balance.isPrimary || size === "hero";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl p-7 transition-all",
        isHero
          ? "bg-gradient-to-br from-violet-600 to-violet-900 text-white shadow-[0_16px_32px_rgba(124,58,237,0.35)]"
          : "bg-white border border-zinc-200 shadow-[0_8px_16px_rgba(15,11,30,0.06)]",
        state === "optimistic-pending" &&
          (isHero
            ? ""
            : "border-2 border-violet-600 border-dashed"),
        state === "optimistic-rolled-back" &&
          "bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-600",
        state === "optimistic-confirmed" &&
          !isHero &&
          "border-2 border-emerald-600",
        state === "loaded-stale" && !isHero && "border-zinc-200",
      )}
    >
      {/* Decorative orbs (hero only) */}
      {isHero && (
        <>
          <div className="absolute right-[-40px] top-[-40px] h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute right-[-20px] bottom-[-20px] h-24 w-24 rounded-full bg-white/[0.06]" />
        </>
      )}

      {/* State badge */}
      <div className="relative">
        {state === "loaded-fresh" && isHero && (
          <StateBadge tone="white-on-violet" withDot>
            Synced · just now
          </StateBadge>
        )}
        {state === "loaded-fresh" && !isHero && (
          <StateBadge tone="emerald" withDot>
            Synced
          </StateBadge>
        )}
        {state === "loaded-stale" && (
          <StateBadge tone="amber" withDot>
            {relativeTime(balance.syncedAt)} · refreshing
          </StateBadge>
        )}
        {state === "optimistic-pending" && (
          <StateBadge
            tone={isHero ? "white-on-violet" : "violet"}
            withDot
            pulsing
          >
            Optimistic · pending
          </StateBadge>
        )}
        {state === "optimistic-rolled-back" && (
          <StateBadge tone="rose">Rolled back</StateBadge>
        )}
        {state === "optimistic-confirmed" && (
          <StateBadge tone="emerald" withDot>
            Confirmed
          </StateBadge>
        )}
      </div>

      {/* Location */}
      <p
        className={cn(
          "mt-5 text-xs font-semibold uppercase tracking-[1px]",
          isHero ? "text-white/80" : "text-zinc-500",
        )}
      >
        {balance.locationName}
      </p>

      {/* Big number */}
      <div className="mt-3 flex items-baseline gap-3 relative">
        <span
          className={cn(
            "font-extrabold tabular-nums tracking-[-3px] leading-none",
            isHero ? "text-white text-[96px]" : "text-[#0F0B1E] text-[80px]",
            state === "optimistic-pending" && !isHero && "text-violet-600",
            state === "optimistic-rolled-back" && "text-[#0F0B1E]",
            state === "loaded-stale" && "opacity-90",
          )}
        >
          {balance.days}
        </span>
        <span
          className={cn(
            "text-lg font-medium",
            isHero ? "text-white/90" : "text-zinc-500",
          )}
        >
          days
        </span>
        {state === "optimistic-pending" && balance.previousDays !== undefined && (
          <span
            className={cn(
              "absolute right-2 top-2 text-sm font-medium line-through",
              isHero ? "text-white/60" : "text-zinc-400",
            )}
          >
            was {balance.previousDays}
          </span>
        )}
      </div>

      {/* Footer chip */}
      {state === "optimistic-rolled-back" && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose-100 border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-800">
          <span aria-hidden>⚠</span>
          Insufficient balance · your draft is restored
        </div>
      )}
      {state === "optimistic-pending" && (
        <p className={cn(
          "mt-3 text-xs font-medium",
          isHero ? "text-white/70" : "text-violet-700",
        )}>
          Awaiting HCM confirmation
        </p>
      )}
      {balance.accrualPerMonth && (state === "loaded-fresh" || state === "loaded-stale") && (
        <p
          className={cn(
            "mt-3 text-xs",
            isHero ? "text-white/70" : "text-zinc-500",
          )}
        >
          + {balance.accrualPerMonth} day{balance.accrualPerMonth !== 1 ? "s" : ""} / month
        </p>
      )}
    </article>
  );
}

// ---- Variant cards ----

function LoadingCard({ size }: { size: "hero" | "default" | "compact" }) {
  return (
    <article className="relative rounded-3xl bg-white border border-zinc-200 p-7 shadow-[0_8px_16px_rgba(15,11,30,0.06)]">
      <div className="h-6 w-24 rounded-full bg-zinc-100" />
      <div className="mt-6 h-4 w-32 rounded bg-zinc-100 animate-pulse" />
      <div className="mt-4 h-16 w-40 rounded-xl bg-zinc-100 animate-pulse" />
      <div className="mt-6 h-3 w-48 rounded bg-zinc-100 animate-pulse" />
      <p className="mt-4 text-xs italic text-zinc-400">Shimmer · under 400ms</p>
    </article>
  );
}

function ErrorCard({ balance, size }: { balance: Balance; size: string }) {
  return (
    <article className="relative rounded-3xl bg-white border-[1.5px] border-rose-600 p-7 shadow-[0_8px_16px_rgba(15,11,30,0.06)]">
      <StateBadge tone="rose">HCM unreachable</StateBadge>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[1px] text-rose-800">
        {balance.locationName}
      </p>
      <div className="mt-3">
        <span className="text-3xl font-bold text-zinc-500">— </span>
        <span className="text-sm text-zinc-500">
          last known: {balance.days} days
        </span>
      </div>
      <button
        type="button"
        className="mt-4 rounded-full bg-[#0F0B1E] px-5 py-2 text-xs font-semibold text-white hover:opacity-90"
      >
        Retry
      </button>
    </article>
  );
}

function AnniversaryCard({ balance, size }: { balance: Balance; size: string }) {
  return (
    <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-500 p-7 shadow-[0_8px_16px_rgba(245,158,11,0.2)]">
      <div className="absolute right-6 top-4 text-amber-600">
        <Sparkle />
      </div>
      <StateBadge tone="amber">Anniversary bonus</StateBadge>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[1px] text-amber-900">
        {balance.locationName}
      </p>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-[80px] font-extrabold tabular-nums tracking-[-3px] leading-none text-amber-900">
          {balance.days}
        </span>
        <span className="text-lg font-medium text-amber-900">days</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-amber-900">
        +1 day added on your work-iversary 🎉
      </p>
    </article>
  );
}

function ReconciledCard({ balance, size }: { balance: Balance; size: string }) {
  return (
    <article className="relative rounded-3xl bg-white border-[1.5px] border-sky-400 p-7 shadow-[0_8px_16px_rgba(15,11,30,0.06)]">
      <StateBadge tone="sky">Reconciled</StateBadge>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[1px] text-sky-800">
        {balance.locationName}
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[80px] font-extrabold tabular-nums tracking-[-3px] leading-none text-[#0F0B1E]">
          {balance.days}
        </span>
        {balance.previousDays !== undefined && (
          <span className="text-sm font-medium text-zinc-500 line-through">
            was {balance.previousDays}
          </span>
        )}
      </div>
      <p className="mt-3 text-xs text-sky-800">
        Reconciled with HCM · background sync
      </p>
    </article>
  );
}

function Sparkle() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor" aria-hidden>
      <path d="M20 0L22 12L34 14L22 16L20 28L18 16L6 14L18 12z" opacity="0.7" />
      <path d="M30 24L31 28L35 29L31 30L30 34L29 30L25 29L29 28z" opacity="0.5" />
    </svg>
  );
}
