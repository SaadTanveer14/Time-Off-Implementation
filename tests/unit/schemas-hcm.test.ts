import { describe, expect, it } from "vitest";
import {
  BalanceSchema,
  EmployeeSchema,
  HcmBatchBalancesResponseSchema,
  HcmBalanceCellSchema,
  HcmRequestSchema,
  HcmSubmitRequestBodySchema,
  LocationSchema,
  PendingApprovalSchema,
  TimeOffRequestSchema,
} from "@/schemas/hcm";
import {
  currentEmployee,
  initialBalances,
  initialRequests,
  locations,
  pendingApprovals,
} from "@/mocks/data";

describe("UI schemas parse fixture data", () => {
  it("parses every initial balance", () => {
    for (const b of initialBalances) {
      expect(() => BalanceSchema.parse(b)).not.toThrow();
    }
  });

  it("parses every initial request", () => {
    for (const r of initialRequests) {
      expect(() => TimeOffRequestSchema.parse(r)).not.toThrow();
    }
  });

  it("parses every pending approval", () => {
    for (const p of pendingApprovals) {
      expect(() => PendingApprovalSchema.parse(p)).not.toThrow();
    }
  });

  it("parses locations and current employee", () => {
    for (const loc of locations) {
      expect(() => LocationSchema.parse(loc)).not.toThrow();
    }
    expect(() => EmployeeSchema.parse(currentEmployee)).not.toThrow();
  });
});

describe("HCM wire schemas (TRD / MOCK_HCM_SPEC)", () => {
  it("parses a single-cell balance response", () => {
    const cell = {
      employeeId: "emp_alex",
      locationId: "ny-hq",
      locationName: "New York HQ",
      available: 10,
      accrualRate: 1.5,
      updatedAt: "2026-04-24T10:12:00.000Z",
    };
    expect(() => HcmBalanceCellSchema.parse(cell)).not.toThrow();
  });

  it("parses batch balances response", () => {
    const batch = {
      employeeId: "emp_alex",
      corpusVersion: 1,
      balances: [
        {
          locationId: "ny-hq",
          locationName: "New York HQ",
          available: 10,
          updatedAt: "2026-04-24T10:12:00.000Z",
        },
      ],
    };
    expect(() => HcmBatchBalancesResponseSchema.parse(batch)).not.toThrow();
  });

  it("parses submit-request body", () => {
    const body = {
      employeeId: "emp_alex",
      locationId: "ny-hq",
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      days: 2,
      note: "Trip",
    };
    expect(() => HcmSubmitRequestBodySchema.parse(body)).not.toThrow();
  });

  it("parses canonical HCM request entity", () => {
    const req = {
      id: "req_001",
      employeeId: "emp_alex",
      locationId: "ny-hq",
      startDate: "2026-05-02",
      endDate: "2026-05-03",
      days: 2,
      status: "pending-approval" as const,
      note: "Long weekend",
      submittedAt: "2026-04-22T12:00:00.000Z",
    };
    expect(() => HcmRequestSchema.parse(req)).not.toThrow();
  });
});
