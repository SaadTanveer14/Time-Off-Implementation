"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { TopBar } from "@/components/shared/TopBar";
import { ApprovalCard } from "./ApprovalCard";
import { QueueSidebar } from "./QueueSidebar";
import { ConflictModal } from "./ConflictModal";
import type { HcmRequest, PendingApproval } from "@/lib/types";
import { manager as copy, requestCountLabel } from "@/copy";
import { useAuth } from "@/hooks/useAuth";
import { usePendingRequests } from "@/hooks/useRequests";
import { useApproveRequest } from "@/hooks/useApproveRequest";
import { useDenyRequest } from "@/hooks/useDenyRequest";
import { getBalance } from "@/lib/hcm-client";
import { qk } from "@/lib/query-keys";
import { balanceQueryDefaults } from "@/lib/query-client";
import { mapHcmRequestToPendingApproval } from "@/lib/map-hcm-to-ui";
import { useManagerFiltersStore } from "@/state/manager-filters.store";
import { useConflictModalStore } from "@/state/conflict-modal.store";

export function ManagerView() {
  const auth = useAuth();
  const filter = useManagerFiltersStore((s) => s.filter);
  const selectedId = useManagerFiltersStore((s) => s.selectedId);
  const setFilter = useManagerFiltersStore((s) => s.setFilter);
  const setSelected = useManagerFiltersStore((s) => s.setSelected);
  const sessionDecisions = useManagerFiltersStore((s) => s.sessionDecisions);
  const pushSessionDecision = useManagerFiltersStore((s) => s.pushSessionDecision);

  const pendingQuery = usePendingRequests(auth.managerId);
  const pendingRaw = pendingQuery.data ?? [];

  const uniquePairs = useMemo(() => {
    const m = new Map<string, HcmRequest>();
    for (const r of pendingRaw) {
      m.set(`${r.employeeId}|${r.locationId}`, r);
    }
    return [...m.values()];
  }, [pendingRaw]);

  const balanceQueries = useQueries({
    queries: uniquePairs.map((req) => ({
      queryKey: qk.balance(req.employeeId, req.locationId),
      queryFn: () => getBalance(req.employeeId, req.locationId),
      ...balanceQueryDefaults,
      enabled: filter === "pending" && pendingRaw.length > 0,
    })),
  });

  const cellByPair = useMemo(() => {
    const map = new Map<string, (typeof balanceQueries)[0]["data"]>();
    uniquePairs.forEach((req, i) => {
      const d = balanceQueries[i]?.data;
      if (d) map.set(`${req.employeeId}|${req.locationId}`, d);
    });
    return map;
  }, [uniquePairs, balanceQueries]);

  const pendingMapped: PendingApproval[] = useMemo(
    () =>
      pendingRaw.map((r) => {
        const cell = cellByPair.get(`${r.employeeId}|${r.locationId}`);
        return mapHcmRequestToPendingApproval(r, cell ?? undefined);
      }),
    [pendingRaw, cellByPair],
  );

  useEffect(() => {
    const ids = pendingMapped.map((r) => r.id);
    if (ids.length === 0) return;
    if (!selectedId || !ids.includes(selectedId)) {
      setSelected(ids[0]!);
    }
  }, [pendingMapped, selectedId, setSelected]);

  const selected =
    pendingMapped.find((r) => r.id === selectedId) ?? pendingMapped[0] ?? null;

  const approveMutation = useApproveRequest();
  const denyMutation = useDenyRequest();

  const committing = approveMutation.isPending || denyMutation.isPending;

  const conflictOpen = useConflictModalStore((s) => s.open);
  const conflictRequestId = useConflictModalStore((s) => s.requestId);
  const conflictStale = useConflictModalStore((s) => s.staleBalance);
  const conflictLive = useConflictModalStore((s) => s.liveBalance);
  const closeConflictModal = useConflictModalStore((s) => s.closeModal);

  const conflictRequest = useMemo(() => {
    if (!conflictOpen || !conflictRequestId) return null;
    return pendingMapped.find((r) => r.id === conflictRequestId) ?? null;
  }, [conflictOpen, conflictRequestId, pendingMapped]);

  const handleApproveClick = useCallback(() => {
    if (!selected) return;
    approveMutation.mutate(
      {
        managerId: auth.managerId,
        requestId: selected.id,
        employeeId: selected.employeeId,
        locationId: selected.locationId,
        requestedDays: selected.days,
        staleBalance: selected.freshBalanceDays,
      },
      {
        onSuccess: () => {
          pushSessionDecision({ req: selected, outcome: "approved" });
        },
      },
    );
  }, [approveMutation, auth.managerId, selected, pushSessionDecision]);

  const handleDeny = useCallback(() => {
    if (!selected) return;
    denyMutation.mutate(
      {
        managerId: auth.managerId,
        requestId: selected.id,
        reason: copy.denyDefaultReason,
        employeeId: selected.employeeId,
        locationId: selected.locationId,
      },
      {
        onSuccess: () => {
          pushSessionDecision({ req: selected, outcome: "denied" });
        },
      },
    );
  }, [denyMutation, auth.managerId, selected, pushSessionDecision]);

  const handleDenyConflictRequest = useCallback(() => {
    const req = conflictRequest ?? selected;
    if (!req) {
      closeConflictModal();
      return;
    }
    denyMutation.mutate(
      {
        managerId: auth.managerId,
        requestId: req.id,
        reason: copy.denyDefaultReason,
        employeeId: req.employeeId,
        locationId: req.locationId,
      },
      {
        onSuccess: () => {
          closeConflictModal();
          pushSessionDecision({ req, outcome: "denied" });
        },
      },
    );
  }, [conflictRequest, selected, denyMutation, auth.managerId, closeConflictModal, pushSessionDecision]);

  const handleApproveAnyway = useCallback(() => {
    const { requestId, liveBalance } = useConflictModalStore.getState();
    if (liveBalance === undefined || requestId === undefined) {
      closeConflictModal();
      return;
    }
    const req = pendingMapped.find((r) => r.id === requestId);
    if (!req) {
      closeConflictModal();
      return;
    }
    closeConflictModal();
    approveMutation.mutate(
      {
        managerId: auth.managerId,
        requestId: req.id,
        employeeId: req.employeeId,
        locationId: req.locationId,
        requestedDays: req.days,
        staleBalance: liveBalance,
      },
      {
        onSuccess: () => {
          pushSessionDecision({ req, outcome: "approved" });
        },
      },
    );
  }, [approveMutation, auth.managerId, pendingMapped, closeConflictModal, pushSessionDecision]);

  const queueOthers = pendingMapped.filter((r) => r.id !== selected?.id);

  const counts = {
    pending: pendingMapped.length,
    approved: sessionDecisions.filter((d) => d.outcome === "approved").length,
    denied: sessionDecisions.filter((d) => d.outcome === "denied").length,
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <TopBar
        variant="manager"
        userName={auth.managerName}
        userInitials={auth.managerInitials}
        userRole={auth.managerRole}
        pendingCount={counts.pending}
      />

      <main className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-20 py-12">
        <header className="mb-8">
          <p className="text-[14px] font-semibold uppercase tracking-[2px] text-violet-600">
            {copy.pageEyebrow}
          </p>
          <h1 className="mt-2 text-[40px] sm:text-[52px] font-extrabold tracking-[-1.5px] text-[#0F0B1E] leading-[1.05]">
            {counts.pending === 0 ? copy.allCaughtUp : requestCountLabel(counts.pending)}
          </h1>
          <p className="mt-3 text-lg text-zinc-500">{copy.subtitle}</p>
        </header>

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
              onSelect={setSelected}
            />
          </div>
        )}

        {filter === "pending" && !selected && (
          <EmptyState title={copy.emptyQueueTitle} body={copy.emptyQueueBody} />
        )}

        {filter === "approved" && (
          <DecidedList
            items={sessionDecisions.filter((d) => d.outcome === "approved")}
            outcome="approved"
          />
        )}
        {filter === "denied" && (
          <DecidedList
            items={sessionDecisions.filter((d) => d.outcome === "denied")}
            outcome="denied"
          />
        )}

        <footer className="mt-16 text-xs italic text-zinc-400">{copy.footerNote}</footer>
      </main>

      {conflictOpen &&
        conflictRequest &&
        conflictStale !== undefined &&
        conflictLive !== undefined && (
          <ConflictModal
            request={conflictRequest}
            staleBalance={conflictStale}
            liveBalance={conflictLive}
            changeDetail={copy.demoChangeDetail}
            onApproveAnyway={handleApproveAnyway}
            onDeny={handleDenyConflictRequest}
            onKeepPending={closeConflictModal}
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
        (active ? "bg-[#0F0B1E] text-white" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100")
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
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#059669"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
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
      <EmptyState title={copy.decidedEmptyTitle(outcome)} body={copy.decidedEmptyBody} />
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
              {req.employeeName
                .split(" ")
                .map((n) => n[0])
                .join("")}
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
