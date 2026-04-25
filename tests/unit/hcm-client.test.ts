import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { ZodError } from "zod";
import {
  approveRequest,
  cancelRequest,
  denyRequest,
  getBalance,
  getBatchBalances,
  getPendingRequests,
  getRequest,
  getRequests,
  HcmClientError,
  submitRequest,
} from "@/lib/hcm-client";
import { server } from "@/mocks/server";

describe("hcm-client", () => {
  it("parses successful read operations", async () => {
    const balance = await getBalance("emp_alex", "ny-hq");
    expect(balance.employeeId).toBe("emp_alex");

    const batch = await getBatchBalances("emp_alex");
    expect(batch.employeeId).toBe("emp_alex");
    expect(batch.balances.length).toBeGreaterThan(0);

    const requests = await getRequests("emp_alex");
    expect(Array.isArray(requests)).toBe(true);

    const pending = await getPendingRequests("mgr_maya");
    expect(Array.isArray(pending)).toBe(true);
  });

  it("supports getRequest by id", async () => {
    const req = await getRequest("req_001");
    expect(req.id).toBe("req_001");
  });

  it("submits request with idempotency key and deduplicates", async () => {
    const key = "idem-phase5";
    const input = {
      employeeId: "emp_alex",
      locationId: "ny-hq",
      startDate: "2026-09-01",
      endDate: "2026-09-02",
      days: 2,
      note: "trip",
    };

    const created1 = await submitRequest(input, key);
    const created2 = await submitRequest(input, key);

    expect(created1.id).toBe(created2.id);
    expect(created1.submittedAt).toBe(created2.submittedAt);
  });

  it("supports approve, deny, and cancel operations", async () => {
    const denied = await denyRequest("req_p001", "Not enough coverage");
    expect(denied.status).toBe("denied");

    const approved = await approveRequest("req_p002");
    expect(approved.status).toBe("approved");

    const cancelled = await cancelRequest("req_p003");
    expect(cancelled.status).toBe("ok");
  });

  it("maps 404/400/409/500 responses to HcmClientError", async () => {
    await expect(getRequest("missing")).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    } satisfies Partial<HcmClientError>);

    await expect(getRequests("")).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION",
    } satisfies Partial<HcmClientError>);

    await expect(
      submitRequest(
        {
          employeeId: "emp_alex",
          locationId: "ny-hq",
          startDate: "2026-10-01",
          endDate: "2026-10-10",
          days: 999,
        },
        "idem-409",
      ),
    ).rejects.toMatchObject({
      status: 409,
      code: "INSUFFICIENT_BALANCE",
    } satisfies Partial<HcmClientError>);

    server.use(
      http.get("*/api/hcm/balances", () => {
        return HttpResponse.json({ message: "boom" }, { status: 500 });
      }),
    );

    await expect(getBalance("emp_alex", "ny-hq")).rejects.toMatchObject({
      status: 500,
      code: "HTTP_ERROR",
    } satisfies Partial<HcmClientError>);
  });

  it("throws ZodError on malformed success payload", async () => {
    server.use(
      http.get("*/api/hcm/balances", () => {
        return HttpResponse.json(
          {
            employeeId: "emp_alex",
            locationId: "ny-hq",
            locationName: "New York HQ",
            available: "not-a-number",
            updatedAt: new Date().toISOString(),
          },
          { status: 200 },
        );
      }),
    );

    await expect(getBalance("emp_alex", "ny-hq")).rejects.toBeInstanceOf(ZodError);
  });
});
