import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { HcmRequestSchema } from "@/lib/types";
import { qk } from "@/lib/query-keys";
import {
  buildBalancesForEmployeeView,
  mapHcmRequestToPendingApproval,
  mapHcmRequestToTimeOffRequest,
} from "@/lib/map-hcm-to-ui";

describe("map-hcm-to-ui", () => {
  it("maps HCM request to time-off row", () => {
    const r = HcmRequestSchema.parse({
      id: "req_x",
      employeeId: "emp_alex",
      locationId: "ny-hq",
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      days: 2,
      status: "pending-approval",
      submittedAt: "2026-04-20T12:00:00.000Z",
    });
    const loc = new Map([["ny-hq", "New York HQ"]]);
    const ui = mapHcmRequestToTimeOffRequest(r, "Alex Rivera", loc);
    expect(ui.status).toBe("pending");
    expect(ui.employeeName).toBe("Alex Rivera");
    expect(ui.locationName).toBe("New York HQ");
    expect(Number.isFinite(ui.submittedAt)).toBe(true);
  });

  it("maps HCM request to pending approval with balance cell", () => {
    const r = HcmRequestSchema.parse({
      id: "req_x",
      employeeId: "emp_alex",
      locationId: "ny-hq",
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      days: 2,
      status: "pending-approval",
      submittedAt: "2026-04-20T12:00:00.000Z",
    });
    const cell = {
      employeeId: "emp_alex",
      locationId: "ny-hq",
      locationName: "New York HQ",
      available: 9,
      updatedAt: "2026-04-20T12:00:00.000Z",
    };
    const p = mapHcmRequestToPendingApproval(r, cell);
    expect(p.freshBalanceDays).toBe(9);
    expect(p.employeeName).toBe("Alex Rivera");
  });

  it("falls back when location id is unknown", () => {
    const r = HcmRequestSchema.parse({
      id: "req_unknown",
      employeeId: "emp_unknown",
      locationId: "loc_unknown",
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      days: 1,
      status: "draft",
      submittedAt: "2026-04-20T12:00:00.000Z",
    });
    const ui = mapHcmRequestToTimeOffRequest(r, "Unknown", new Map());
    expect(ui.locationId).toBe("ny-hq");
    expect(ui.status).toBe("pending");
    expect(ui.locationName).toBe("");
  });

  it("maps pending-submit status to optimistic request", () => {
    const r = HcmRequestSchema.parse({
      id: "req_submit",
      employeeId: "emp_alex",
      locationId: "ny-hq",
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      days: 2,
      status: "pending-submit",
      submittedAt: "2026-04-20T12:00:00.000Z",
    });
    const ui = mapHcmRequestToTimeOffRequest(r, "Alex Rivera", new Map());
    expect(ui.status).toBe("submitting");
    expect(ui.optimistic).toBe(true);
  });

  it("builds loading balances when batch is pending", () => {
    const qc = new QueryClient();
    const rows = buildBalancesForEmployeeView({
      employeeId: "emp_alex",
      primaryLocationId: "ny-hq",
      batch: undefined,
      dataUpdatedAt: 0,
      isPending: true,
      isFetching: false,
      isError: false,
      queryClient: qc,
      submitMutationIsPending: false,
      submitLocationId: undefined,
    });
    expect(rows.every((b) => b.state === "loading")).toBe(true);
  });

  it("builds error balance when query errors", () => {
    const qc = new QueryClient();
    const rows = buildBalancesForEmployeeView({
      employeeId: "emp_alex",
      primaryLocationId: "remote",
      batch: undefined,
      dataUpdatedAt: Date.now(),
      isPending: false,
      isFetching: false,
      isError: true,
      queryClient: qc,
      submitMutationIsPending: false,
      submitLocationId: undefined,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.state).toBe("error");
    expect(rows[0]?.locationId).toBe("remote");
  });

  it("uses loaded-fresh fallback when batch is empty", () => {
    const qc = new QueryClient();
    const rows = buildBalancesForEmployeeView({
      employeeId: "emp_alex",
      primaryLocationId: "sf",
      batch: { employeeId: "emp_alex", balances: [], corpusVersion: 1 },
      dataUpdatedAt: Date.now(),
      isPending: false,
      isFetching: false,
      isError: false,
      queryClient: qc,
      submitMutationIsPending: false,
      submitLocationId: undefined,
    });
    expect(rows[0]?.state).toBe("loaded-fresh");
    expect(rows[0]?.locationId).toBe("sf");
  });

  it("prefers cached cell and marks stale by age", () => {
    const qc = new QueryClient();
    const key = qk.balance("emp_alex", "ny-hq");
    qc.setQueryData(key, {
      employeeId: "emp_alex",
      locationId: "ny-hq",
      locationName: "New York HQ",
      available: 42,
      updatedAt: "2026-04-20T12:00:00.000Z",
    });
    const rows = buildBalancesForEmployeeView({
      employeeId: "emp_alex",
      primaryLocationId: "ny-hq",
      batch: {
        employeeId: "emp_alex",
        corpusVersion: 1,
        balances: [
          {
            locationId: "ny-hq",
            locationName: "New York HQ",
            available: 10,
            updatedAt: "2026-04-20T12:00:00.000Z",
          },
        ],
      },
      dataUpdatedAt: Date.now() - 90_000,
      isPending: false,
      isFetching: false,
      isError: false,
      queryClient: qc,
      submitMutationIsPending: false,
      submitLocationId: undefined,
    });
    expect(rows[0]?.days).toBe(42);
    expect(rows[0]?.state).toBe("loaded-stale");
  });

  it("marks row optimistic-pending when matching submit location", () => {
    const qc = new QueryClient();
    const rows = buildBalancesForEmployeeView({
      employeeId: "emp_alex",
      primaryLocationId: "ny-hq",
      batch: {
        employeeId: "emp_alex",
        corpusVersion: 1,
        balances: [
          {
            locationId: "ny-hq",
            locationName: "New York HQ",
            available: 10,
            updatedAt: "2026-04-20T12:00:00.000Z",
          },
        ],
      },
      dataUpdatedAt: Date.now(),
      isPending: false,
      isFetching: false,
      isError: false,
      queryClient: qc,
      submitMutationIsPending: true,
      submitLocationId: "ny-hq",
    });
    expect(rows[0]?.state).toBe("optimistic-pending");
  });

  it("maps pending approval with fallback values when fresh cell is missing", () => {
    const r = HcmRequestSchema.parse({
      id: "req_unknown_2",
      employeeId: "emp_unknown",
      locationId: "loc_unknown",
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      days: 1,
      status: "cancelled",
      submittedAt: "2026-04-20T12:00:00.000Z",
    });
    const p = mapHcmRequestToPendingApproval(r, undefined);
    expect(p.freshBalanceDays).toBe(0);
    expect(p.locationName).toBe("New York HQ");
    expect(p.status).toBe("cancelled");
  });
});
