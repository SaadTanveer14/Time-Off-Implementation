"use client";

import { useMemo, useState } from "react";
import { TopBar } from "@/components/shared/TopBar";
import { currentEmployee } from "@/mocks/data";
import {
  conflictOnApprove,
  conflictOnApproveOnce,
  rejectInsufficientAt,
  silentFailOnce,
  silentFailRate,
  yearStartAt,
  happyPath,
} from "@/mocks/hcm/scenarios";
import { applyAnniversaryBonus, getMockState, resetMockState } from "@/mocks/hcm/state";
import { mockScenarioFlags, resetScenarioFlags } from "@/mocks/hcm/scenario-flags";

export default function MockControlsPage() {
  const [silentRate, setSilentRate] = useState("0");
  const [rejectDays, setRejectDays] = useState("4");
  const [rejectEmployeeId, setRejectEmployeeId] = useState("emp_alex");
  const [rejectLocationId, setRejectLocationId] = useState("ny-hq");
  const [refreshKey, setRefreshKey] = useState(0);

  const balances = useMemo(() => {
    void refreshKey;
    const rows: Array<{ locationId: string; available: number; updatedAt: string }> = [];
    for (const [, cell] of getMockState().balances) {
      if (cell.employeeId !== "emp_alex") continue;
      rows.push({ locationId: cell.locationId, available: cell.available, updatedAt: cell.updatedAt });
    }
    return rows.sort((a, b) => a.locationId.localeCompare(b.locationId));
  }, [refreshKey]);

  const pendingRequests = useMemo(() => {
    void refreshKey;
    return [...getMockState().requests.values()].filter((r) => r.status === "pending-approval").length;
  }, [refreshKey]);

  const refresh = () => setRefreshKey((v) => v + 1);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <TopBar
        variant="employee"
        userName={currentEmployee.name}
        userInitials={currentEmployee.initials}
        userRole={currentEmployee.role}
      />

      <main className="mx-auto max-w-[1200px] px-6 sm:px-12 lg:px-20 py-12">
        <header className="mb-8">
          <p className="text-[14px] font-semibold uppercase tracking-[2px] text-violet-600">Testing Tools</p>
          <h1 className="mt-2 text-[40px] sm:text-[52px] font-extrabold tracking-[-1.5px] text-[#0F0B1E] leading-[1.05]">
            Mock Controls
          </h1>
          <p className="mt-3 text-lg text-zinc-500">
            Trigger mock HCM scenarios and verify behavior in employee/manager views.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Quick Actions">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ActionButton
                label="Reset mock state"
                onClick={() => {
                  resetMockState();
                  resetScenarioFlags();
                  happyPath();
                  refresh();
                }}
              />
              <ActionButton
                label="Silent fail once"
                onClick={() => {
                  silentFailOnce();
                  refresh();
                }}
              />
              <ActionButton
                label="Anniversary bonus now"
                onClick={() => {
                  applyAnniversaryBonus("emp_alex");
                  refresh();
                }}
              />
              <ActionButton
                label="Year start refresh now"
                onClick={() => {
                  yearStartAt(0);
                  refresh();
                }}
              />
              <ActionButton
                label="Conflict on approve once"
                onClick={() => {
                  // Target a real pending request to make the scenario deterministic.
                  const firstPending = [...getMockState().requests.values()].find(
                    (r) => r.status === "pending-approval",
                  );
                  if (firstPending) {
                    conflictOnApprove(firstPending.id);
                  } else {
                    conflictOnApproveOnce();
                  }
                  refresh();
                }}
              />
            </div>
          </Card>

          <Card title="Silent Failure Rate">
            <div className="flex flex-col gap-3">
              <label className="text-sm text-zinc-700">
                Rate (0 to 1)
                <input
                  value={silentRate}
                  onChange={(e) => setSilentRate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <ActionButton
                label="Apply silent fail rate"
                onClick={() => {
                  const rate = Number.parseFloat(silentRate);
                  if (Number.isNaN(rate)) return;
                  silentFailRate(rate);
                  refresh();
                }}
              />
            </div>
          </Card>

          <Card title="Force Insufficient Balance">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-sm text-zinc-700">
                Employee ID
                <input
                  value={rejectEmployeeId}
                  onChange={(e) => setRejectEmployeeId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-700">
                Location ID
                <input
                  value={rejectLocationId}
                  onChange={(e) => setRejectLocationId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-700">
                Days
                <input
                  value={rejectDays}
                  onChange={(e) => setRejectDays(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-3">
              <ActionButton
                label="Apply insufficient-balance rule"
                onClick={() => {
                  const days = Number.parseInt(rejectDays, 10);
                  if (!Number.isFinite(days) || days <= 0) return;
                  rejectInsufficientAt({
                    employeeId: rejectEmployeeId.trim(),
                    locationId: rejectLocationId.trim(),
                    days,
                  });
                  refresh();
                }}
              />
            </div>
          </Card>

          <Card title="Current Mock Snapshot">
            <div className="space-y-2 text-sm">
              <p>
                <strong>Pending approvals:</strong> {pendingRequests}
              </p>
              <p>
                <strong>silentFailRate:</strong> {mockScenarioFlags.silentFailRate}
              </p>
              <p>
                <strong>silentFailOnce:</strong> {String(mockScenarioFlags.silentFailOnce)}
              </p>
              <p>
                <strong>rejectInsufficientAt:</strong>{" "}
                {mockScenarioFlags.rejectInsufficientAt
                  ? `${mockScenarioFlags.rejectInsufficientAt.employeeId} · ${mockScenarioFlags.rejectInsufficientAt.locationId} · ${mockScenarioFlags.rejectInsufficientAt.days}d`
                  : "none"}
              </p>
              <div className="pt-2">
                <p className="font-semibold text-zinc-700">emp_alex balances</p>
                <ul className="mt-1 space-y-1 text-zinc-600">
                  {balances.map((b) => (
                    <li key={b.locationId}>
                      {b.locationId}: {b.available} (updated {new Date(b.updatedAt).toLocaleTimeString()})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-[0_8px_16px_rgba(15,11,30,0.06)]">
      <h2 className="text-lg font-bold text-[#0F0B1E]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
    >
      {label}
    </button>
  );
}
