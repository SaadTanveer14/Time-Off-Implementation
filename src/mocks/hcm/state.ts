import type { HcmBalanceCell, HcmRequest, HcmRequestStatus } from "@/schemas/hcm";
import {
  initialBalances,
  initialRequests,
  locations,
  pendingApprovals,
} from "@/mocks/data";
import { getNow, toIso } from "./clock";
import { resetScenarioFlags } from "./scenario-flags";

export type BalanceKey = `${string}|${string}`;

export type MockEmployeeRecord = {
  managerId: string;
  anniversaryDate: string;
  primaryLocationId: string;
};

export interface MockState {
  employees: Map<string, MockEmployeeRecord>;
  balances: Map<BalanceKey, HcmBalanceCell>;
  requests: Map<string, HcmRequest>;
  corpusVersion: number;
  idempotencyLog: Map<string, { responseBody: unknown; expiresAt: number }>;
}

const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;

/** Annual reset targets (policy defaults) — location slugs match fixtures. */
const POLICY_DEFAULT_AVAILABLE: Record<string, number> = {
  "ny-hq": 15,
  remote: 10,
  sf: 12,
};

const POLICY_DEFAULT_ACCRUAL: Record<string, number | undefined> = {
  "ny-hq": 1.5,
  remote: 0.5,
  sf: 1,
};

let state: MockState = buildSeedState();

function balanceKey(employeeId: string, locationId: string): BalanceKey {
  return `${employeeId}|${locationId}`;
}

function uiStatusToHcm(s: string): HcmRequestStatus {
  switch (s) {
    case "pending":
      return "pending-approval";
    case "submitting":
      return "pending-submit";
    case "approved":
      return "approved";
    case "denied":
      return "denied";
    case "cancelled":
      return "cancelled";
    default:
      return "pending-approval";
  }
}

function epochToIso(epoch: number): string {
  return new Date(epoch).toISOString();
}

function buildSeedState(): MockState {
  const employees = new Map<string, MockEmployeeRecord>([
    [
      "emp_alex",
      {
        managerId: "mgr_maya",
        anniversaryDate: "2026-04-24",
        primaryLocationId: "ny-hq",
      },
    ],
    [
      "emp_jordan",
      {
        managerId: "mgr_maya",
        anniversaryDate: "2000-01-01",
        primaryLocationId: "remote",
      },
    ],
    [
      "emp_sam",
      {
        managerId: "mgr_maya",
        anniversaryDate: "1995-06-15",
        primaryLocationId: "sf",
      },
    ],
    [
      "emp_priya",
      {
        managerId: "mgr_maya",
        anniversaryDate: "1992-03-10",
        primaryLocationId: "ny-hq",
      },
    ],
    [
      "mgr_maya",
      {
        managerId: "mgr_maya",
        anniversaryDate: "1988-11-02",
        primaryLocationId: "ny-hq",
      },
    ],
  ]);

  const balances = new Map<BalanceKey, HcmBalanceCell>();
  const now = getNow();
  const updatedAt = toIso(now);

  for (const b of initialBalances) {
    balances.set(balanceKey("emp_alex", b.locationId), {
      employeeId: "emp_alex",
      locationId: b.locationId,
      locationName: b.locationName,
      available: b.days,
      accrualRate: b.accrualPerMonth,
      updatedAt,
    });
  }

  const seedOthers: Array<{ employeeId: string; cells: Array<{ locationId: string; available: number }> }> = [
    {
      employeeId: "emp_jordan",
      cells: [
        { locationId: "remote", available: 4 },
        { locationId: "ny-hq", available: 2 },
        { locationId: "sf", available: 2 },
      ],
    },
    {
      employeeId: "emp_sam",
      cells: [
        { locationId: "sf", available: 15 },
        { locationId: "ny-hq", available: 5 },
        { locationId: "remote", available: 3 },
      ],
    },
    {
      employeeId: "emp_priya",
      cells: [
        { locationId: "ny-hq", available: 12 },
        { locationId: "remote", available: 6 },
        { locationId: "sf", available: 4 },
      ],
    },
    {
      employeeId: "mgr_maya",
      cells: [
        { locationId: "ny-hq", available: 20 },
        { locationId: "remote", available: 8 },
        { locationId: "sf", available: 10 },
      ],
    },
  ];

  const locName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;

  for (const row of seedOthers) {
    for (const c of row.cells) {
      balances.set(balanceKey(row.employeeId, c.locationId), {
        employeeId: row.employeeId,
        locationId: c.locationId,
        locationName: locName(c.locationId),
        available: c.available,
        accrualRate: POLICY_DEFAULT_ACCRUAL[c.locationId],
        updatedAt,
      });
    }
  }

  const requests = new Map<string, HcmRequest>();

  for (const r of initialRequests) {
    const decidedAt = r.decidedAt !== undefined ? epochToIso(r.decidedAt) : undefined;
    requests.set(r.id, {
      id: r.id,
      employeeId: r.employeeId,
      locationId: r.locationId,
      startDate: r.startDate,
      endDate: r.endDate,
      days: r.days,
      status: uiStatusToHcm(r.status),
      note: r.note,
      submittedAt: epochToIso(r.submittedAt),
      decidedAt,
      decidedBy:
        r.status === "approved" || r.status === "denied" || r.status === "cancelled"
          ? "mgr_maya"
          : undefined,
      denialReason: r.status === "denied" ? "Not enough coverage that week." : undefined,
    });
  }

  for (const p of pendingApprovals) {
    requests.set(p.id, {
      id: p.id,
      employeeId: p.employeeId,
      locationId: p.locationId,
      startDate: p.startDate,
      endDate: p.endDate,
      days: p.days,
      status: "pending-approval",
      note: p.note,
      submittedAt: epochToIso(p.submittedAt),
    });
  }

  return {
    employees,
    balances,
    requests,
    corpusVersion: 1,
    idempotencyLog: new Map(),
  };
}

export function getMockState(): MockState {
  return state;
}

export function resetMockState(): void {
  resetScenarioFlags();
  state = buildSeedState();
}

export function bumpCorpusVersion(): void {
  state.corpusVersion += 1;
}

export function getBalanceCell(employeeId: string, locationId: string): HcmBalanceCell | undefined {
  return state.balances.get(balanceKey(employeeId, locationId));
}

export function setBalanceCell(cell: HcmBalanceCell): void {
  state.balances.set(balanceKey(cell.employeeId, cell.locationId), cell);
}

export function applyBalanceDelta(employeeId: string, locationId: string, delta: number): HcmBalanceCell | null {
  const key = balanceKey(employeeId, locationId);
  const cur = state.balances.get(key);
  if (!cur) return null;
  const nextAvailable = Math.max(0, cur.available + delta);
  const next: HcmBalanceCell = {
    ...cur,
    available: nextAvailable,
    updatedAt: toIso(),
  };
  state.balances.set(key, next);
  bumpCorpusVersion();
  return next;
}

export function applyExternalBalanceEdit(employeeId: string, locationId: string, delta: number): void {
  applyBalanceDelta(employeeId, locationId, delta);
}

export function yearStartResetAll(): void {
  const updatedAt = toIso();
  for (const employeeId of state.employees.keys()) {
    for (const loc of locations) {
      state.balances.set(balanceKey(employeeId, loc.id), {
        employeeId,
        locationId: loc.id,
        locationName: loc.name,
        available: POLICY_DEFAULT_AVAILABLE[loc.id] ?? 10,
        accrualRate: POLICY_DEFAULT_ACCRUAL[loc.id],
        updatedAt,
      });
    }
  }
  bumpCorpusVersion();
}

/** +1 day to employee's primary location balance (anniversary bonus). */
export function applyAnniversaryBonus(employeeId: string): void {
  const emp = state.employees.get(employeeId);
  if (!emp) return;
  applyBalanceDelta(employeeId, emp.primaryLocationId, 1);
}

export function getRequestById(id: string): HcmRequest | undefined {
  return state.requests.get(id);
}

export function putRequest(req: HcmRequest): void {
  state.requests.set(req.id, req);
}

export function peekIdempotency(key: string): { responseBody: unknown; expiresAt: number } | undefined {
  const row = state.idempotencyLog.get(key);
  if (!row) return undefined;
  if (row.expiresAt <= getNow()) {
    state.idempotencyLog.delete(key);
    return undefined;
  }
  return row;
}

export function storeIdempotency(key: string, responseBody: unknown): void {
  state.idempotencyLog.set(key, {
    responseBody,
    expiresAt: getNow() + IDEMPOTENCY_TTL_MS,
  });
}

export function nextGeneratedRequestId(): string {
  return `req_${getNow()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function employeeReportingManager(employeeId: string): string | undefined {
  return state.employees.get(employeeId)?.managerId;
}
