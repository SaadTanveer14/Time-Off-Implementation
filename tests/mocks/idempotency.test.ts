import { describe, expect, it } from "vitest";

describe("POST /api/hcm/requests idempotency", () => {
  it("returns the same created request for duplicate Idempotency-Key", async () => {
    const key = "idem-test-1";
    const body = {
      employeeId: "emp_alex",
      locationId: "ny-hq",
      startDate: "2026-08-01",
      endDate: "2026-08-02",
      days: 2,
      note: "idem",
    };

    const r1 = await fetch("http://localhost/api/hcm/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify(body),
    });
    expect(r1.status).toBe(201);
    const j1 = await r1.json();

    const r2 = await fetch("http://localhost/api/hcm/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify(body),
    });
    expect(r2.status).toBe(201);
    const j2 = await r2.json();

    expect(j2.id).toBe(j1.id);
    expect(j2.submittedAt).toBe(j1.submittedAt);
  });
});
