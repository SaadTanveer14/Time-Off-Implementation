"use client";

import { useState } from "react";
import { TopBar } from "@/components/shared/TopBar";
import { ApprovalCard } from "./ApprovalCard";
import { QueueSidebar } from "./QueueSidebar";
import { ConflictModal } from "./ConflictModal";
import { currentManager, pendingApprovals as initialPending } from "@/mocks/data";
import type { PendingApproval } from "@/lib/types";
import { manager as copy, requestCountLabel } from "@/copy";

type Filter = "pending" | "approved" | "denied";

export function ManagerView() {
  const [pending, setPending] = useState<PendingApproval[]>(initialPending);
  const [decided, setDecided] = useState<
    { req: PendingApproval; outcome: "approved" | "denied" }[]
  >([]);
  const [selectedId, setSelectedId] = useState<string>(initialPending[0]?.id ?? "");
  const [filter, setFilter] = useState<Filter>("pending");
  const [committing, setCommitting] = useState(false);

  // Conflict modal state — randomly trigger on approve to demo
  const [conflict, setConflict] = useState<{
    request: PendingApproval;
    staleBalance: number;
    liveBalance: number;
  } | null>(null);

  const selected =
    pending.find((r) => r.id === selectedId) ?? pending[0] ?? null;

  const handleApproveClick = () => {
    if (!selected) return;

    // ~50% chance trigger conflict modal for the demo
    const shouldConflict = Math.random() < 0.5;
    if (shouldConflict) {
      setConflict({
        request: selected,
        staleBalance: selected.freshBalanceDays,
        liveBalance: Math.max(selected.days, selected.freshBalanceDays - 4),
      });
      return;
    }
    commitApproval(selected);
  };

  const commitApproval = (req: PendingApproval) => {
    setCommitting(true);
    setTimeout(() => {
      setPending((prev) => prev.filter((r) => r.id !== req.id));
      setDecided((prev) => [{ req, outcome: "approved" }, ...prev]);
      setSelectedId((prev) => {
        const remaining = pending.filter((r) => r.id !== req.id);
        return remaining[0]?.id ?? "";
      });
      setCommitting(false);
      setConflict(null);
    }, 1100);
  };

  const handleDeny = () => {
    if (!selected) return;
    setCommitting(true);
    setTimeout(() => {
      setPending((prev) => prev.filter((r) => r.id !== selected.id));
      setDecided((prev) => [
        { req: selected, outcome: "denied" },
        ...prev,
      ]);
      setSelectedId((prev) => {
        const remaining = pending.filter((r) => r.id !== selected.id);
        return remaining[0]?.id ?? "";
      });
      setCommitting(false);
      setConflict(null);
    }, 800);
  };

  const queueOthers = pending.filter((r) => r.id !== selected?.id);

  const counts = {
    pending: pending.length,
    approved: decided.filter((d) => d.outcome === "approved").length,
    denied: decided.filter((d) => d.outcome === "denied").length,
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <TopBar
        variant="manager"
        userName={currentManager.name}
        userInitials={currentManager.initials}
        userRole={currentManager.role}
        pendingCount={counts.pending}
      />

      <main className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-20 py-12">
        {/* Page header */}
        <header className="mb-8">
          <p className="text-[14px] font-semibold uppercase tracking-[2px] text-violet-600">
            {copy.pageEyebrow}
          </p>
          <h1 className="mt-2 text-[40px] sm:text-[52px] font-extrabold tracking-[-1.5px] text-[#0F0B1E] leading-[1.05]">
            {counts.pending === 0 ? copy.allCaughtUp : requestCountLabel(counts.pending)}
          </h1>
          <p className="mt-3 text-lg text-zinc-500">
            {copy.subtitle}
          </p>
        </header>

        {/* Filter bar */}
        <div className="mb-8 flex items-center gap-2 rounded-2xl bg-white border border-zinc-200 p-3">
          <FilterChip
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
            count={counts.pending}
            tone="amber"
          >
            {copy.filterPending}
          </FilterChip>
          <FilterChip
            active={filter === "approved"}
            onClick={() => setFilter("approved")}
            count={counts.approved}
            tone="emerald"
          >
            {copy.filterApproved}
          </FilterChip>
          <FilterChip
            active={filter === "denied"}
            onClick={() => setFilter("denied")}
            count={counts.denied}
            tone="rose"
          >
            {copy.filterDenied}
          </FilterChip>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-500">{copy.sortBy}</span>
            <span className="rounded-full bg-zinc-50 border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-[#0F0B1E]">
              {copy.sortSubmitted}
            </span>
          </div>
        </div>

        {/* Main grid */}
        {filter === "pending" && selected && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-8">
            <ApprovalCard
              request={selected}
              isOldest
              pending={committing}
              onApprove={handleApproveClick}
              onDeny={handleDeny}
            />
            <QueueSidebar
              items={queueOthers}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        )}

        {filter === "pending" && !selected && (
          <EmptyState
            title={copy.emptyQueueTitle}
            body={copy.emptyQueueBody}
          />
        )}

        {filter === "approved" && (
          <DecidedList items={decided.filter((d) => d.outcome === "approved")} outcome="approved" />
        )}
        {filter === "denied" && (
          <DecidedList items={decided.filter((d) => d.outcome === "denied")} outcome="denied" />
        )}

        {/* Footer */}
        <footer className="mt-16 text-xs italic text-zinc-400">
          {copy.footerNote}
        </footer>
      </main>

      {conflict && (
        <ConflictModal
          request={conflict.request}
          staleBalance={conflict.staleBalance}
          liveBalance={conflict.liveBalance}
          changeDetail={copy.demoChangeDetail}
          onApproveAnyway={() => commitApproval(conflict.request)}
          onDeny={handleDeny}
          onKeepPending={() => setConflict(null)}
        />
      )}
    </div>
  );
}

function FilterChip({
  active,
  count,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  tone: "amber" | "emerald" | "rose";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const dot = {
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors " +
        (active
          ? "bg-[#0F0B1E] text-white"
          : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100")
      }
    >
      <span className={"h-1.5 w-1.5 rounded-full " + dot} />
      {children} · {count}
    </button>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl bg-white border border-dashed border-zinc-300 p-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="4,12 10,18 20,6" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-[#0F0B1E]">{title}</h3>
      <p className="mt-2 text-sm text-zinc-500">{body}</p>
    </div>
  );
}

function DecidedList({
  items,
  outcome,
}: {
  items: { req: PendingApproval; outcome: "approved" | "denied" }[];
  outcome: "approved" | "denied";
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title={copy.decidedEmptyTitle(outcome)}
        body={copy.decidedEmptyBody}
      />
    );
  }
  return (
    <ul className="space-y-3">
      {items.map(({ req }) => (
        <li
          key={req.id}
          className="flex items-center gap-4 rounded-2xl bg-white border border-zinc-200 p-5"
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: req.employeeAvatarColor }}
          >
            <span className="text-xs font-bold text-violet-800">
              {req.employeeName.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#0F0B1E]">{req.employeeName}</p>
            <p className="text-xs text-zinc-500">
              {req.startDate} → {req.endDate} · {req.days} days · {req.locationName}
            </p>
          </div>
          <span
            className={
              "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider " +
              (outcome === "approved"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800")
            }
          >
            {outcome}
          </span>
        </li>
      ))}
    </ul>
  );
}
