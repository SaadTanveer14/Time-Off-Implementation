"use client";

import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/shared/TopBar";
import { BalanceCard } from "./BalanceCard";
import { RequestComposer } from "./RequestComposer";
import { RequestHistory } from "./RequestHistory";
import { AnniversaryToast, UndoToast } from "./AnniversaryToast";
import { currentEmployee, initialBalances, initialRequests } from "@/mocks/data";
import type { Balance, LocationId, TimeOffRequest } from "@/lib/types";
import { newId } from "@/lib/utils";

export function EmployeeView() {
  const [balances, setBalances] = useState<Balance[]>(initialBalances);
  const [requests, setRequests] = useState<TimeOffRequest[]>(initialRequests);

  // Anniversary toast (shown on mount, like the design)
  const [anniversaryVisible, setAnniversaryVisible] = useState(true);

  // Undo toast for cancellations
  const [undoState, setUndoState] = useState<{
    request: TimeOffRequest;
    secondsLeft: number;
  } | null>(null);

  // Auto-dismiss anniversary toast
  useEffect(() => {
    const t = setTimeout(() => setAnniversaryVisible(false), 6000);
    return () => clearTimeout(t);
  }, []);

  // Undo countdown
  useEffect(() => {
    if (!undoState) return;
    if (undoState.secondsLeft <= 0) {
      // Commit cancellation
      setRequests((prev) =>
        prev.map((r) =>
          r.id === undoState.request.id ? { ...r, status: "cancelled" as const } : r,
        ),
      );
      setUndoState(null);
      return;
    }
    const t = setTimeout(
      () =>
        setUndoState((prev) =>
          prev ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : null,
        ),
      1000,
    );
    return () => clearTimeout(t);
  }, [undoState]);

  const availableByLocation: Record<LocationId, number> = balances.reduce(
    (acc, b) => {
      acc[b.locationId] = b.days;
      return acc;
    },
    {} as Record<LocationId, number>,
  );

  // ----- Submit handler with optimistic mutation -----
  const handleSubmit = (input: {
    locationId: LocationId;
    startDate: string;
    endDate: string;
    days: number;
    note?: string;
  }) => {
    const id = newId("req");
    const optimisticReq: TimeOffRequest = {
      id,
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      locationId: input.locationId,
      locationName:
        balances.find((b) => b.locationId === input.locationId)?.locationName ?? "",
      startDate: input.startDate,
      endDate: input.endDate,
      days: input.days,
      status: "submitting",
      note: input.note,
      submittedAt: Date.now(),
      optimistic: true,
    };

    // Optimistic add
    setRequests((prev) => [optimisticReq, ...prev]);

    // Optimistic balance decrement
    setBalances((prev) =>
      prev.map((b) =>
        b.locationId === input.locationId
          ? {
              ...b,
              previousDays: b.days,
              days: b.days - input.days,
              state: "optimistic-pending",
            }
          : b,
      ),
    );

    // Simulate HCM confirmation after 1.2s
    setTimeout(() => {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "pending" as const, optimistic: false }
            : r,
        ),
      );
      setBalances((prev) =>
        prev.map((b) =>
          b.locationId === input.locationId
            ? {
                ...b,
                state: "loaded-fresh",
                syncedAt: Date.now(),
                previousDays: undefined,
              }
            : b,
        ),
      );
    }, 1200);
  };

  // ----- Cancel with undo -----
  const handleCancel = (id: string) => {
    const target = requests.find((r) => r.id === id);
    if (!target) return;

    // Hide row immediately by marking as cancelling-optimistic
    setRequests((prev) => prev.filter((r) => r.id !== id));

    // Restore balance optimistically
    setBalances((prev) =>
      prev.map((b) =>
        b.locationId === target.locationId
          ? { ...b, days: b.days + target.days }
          : b,
      ),
    );

    setUndoState({ request: target, secondsLeft: 5 });
  };

  const handleUndo = () => {
    if (!undoState) return;
    setRequests((prev) => [undoState.request, ...prev]);
    setBalances((prev) =>
      prev.map((b) =>
        b.locationId === undoState.request.locationId
          ? { ...b, days: b.days - undoState.request.days }
          : b,
      ),
    );
    setUndoState(null);
  };

  const heroBalance = balances.find((b) => b.isPrimary) ?? balances[0];
  const otherBalances = balances.filter((b) => b !== heroBalance);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <TopBar
        variant="employee"
        userName={currentEmployee.name}
        userInitials={currentEmployee.initials}
        userRole={currentEmployee.role}
      />

      <main className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-20 py-12">
        {/* Page header */}
        <header className="mb-10">
          <p className="text-[14px] font-semibold uppercase tracking-[2px] text-violet-600">
            Hi, {currentEmployee.name.split(" ")[0]}
          </p>
          <h1 className="mt-2 text-[40px] sm:text-[56px] font-extrabold tracking-[-1.5px] text-[#0F0B1E] leading-[1.05]">
            Your time off, at a glance.
          </h1>
        </header>

        {/* Balance cards */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
          {heroBalance && (
            <div className="lg:col-span-1">
              <BalanceCard balance={heroBalance} size="hero" />
            </div>
          )}
          {otherBalances.map((b) => (
            <BalanceCard key={b.locationId} balance={b} />
          ))}
        </section>

        {/* Composer + History */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <RequestComposer
              availableByLocation={availableByLocation}
              onSubmit={handleSubmit}
            />
          </div>
          <div className="lg:col-span-3">
            <RequestHistory requests={requests} onCancel={handleCancel} />
          </div>
        </section>
      </main>

      {/* Toasts */}
      {anniversaryVisible && (
        <AnniversaryToast
          locationName="New York HQ"
          daysAdded={1}
          onDismiss={() => setAnniversaryVisible(false)}
        />
      )}
      {undoState && (
        <UndoToast
          message="Request cancelled"
          onUndo={handleUndo}
          remaining={undoState.secondsLeft}
        />
      )}
    </div>
  );
}
