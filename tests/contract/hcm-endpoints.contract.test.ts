import { describe, expect, it } from "vitest";
import { HcmBalanceCellSchema, HcmDenyRequestBodySchema, HcmRequestSchema } from "@/schemas/hcm";

describe("HCM endpoint contract", () => {
  it("rejects missing required query params", async () => {
    const res = await fetch("/api/hcm/balances");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION");
  });

  it("returns valid balance shape for a known employee/location", async () => {
    const res = await fetch("/api/hcm/balances?employeeId=emp_alex&locationId=ny-hq");
    expect(res.status).toBe(200);
    const body = await res.json();
    const parsed = HcmBalanceCellSchema.safeParse(body);
    expect(parsed.success).toBe(true);
  });

  it("enforces POST /requests payload and idempotency behavior", async () => {
    const invalid = await fetch("/api/hcm/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": "k-invalid" },
      body: JSON.stringify({ employeeId: "emp_alex" }),
    });
    expect(invalid.status).toBe(400);

    const payload = {
      employeeId: "emp_alex",
      locationId: "ny-hq",
      startDate: "2026-06-01",
      endDate: "2026-06-02",
      days: 2,
      note: "family trip",
    };
    const first = await fetch("/api/hcm/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": "k-1" },
      body: JSON.stringify(payload),
    });
    expect(first.status).toBe(201);
    const firstBody = HcmRequestSchema.parse(await first.json());

    const second = await fetch("/api/hcm/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": "k-1" },
      body: JSON.stringify(payload),
    });
    expect(second.status).toBe(201);
    const secondBody = HcmRequestSchema.parse(await second.json());
    expect(secondBody.id).toBe(firstBody.id);
  });

  it("requires denial reason and returns denied request", async () => {
    HcmDenyRequestBodySchema.parse({ reason: "Insufficient staffing" });

    const bad = await fetch("/api/hcm/requests/req_001/deny", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(bad.status).toBe(400);

    const ok = await fetch("/api/hcm/requests/req_001/deny", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Insufficient staffing" }),
    });
    expect(ok.status).toBe(200);
    const denied = HcmRequestSchema.parse(await ok.json());
    expect(denied.status).toBe("denied");
  });
});
