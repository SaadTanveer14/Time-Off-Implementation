import { describe, expect, it } from "vitest";
import { HcmApproveRequestBodySchema, HcmRequestSchema, HcmSubmitRequestBodySchema } from "@/schemas/hcm";

describe("HCM schema contract", () => {
  it("accepts canonical valid payloads", () => {
    expect(
      HcmSubmitRequestBodySchema.safeParse({
        employeeId: "emp_alex",
        locationId: "ny-hq",
        startDate: "2026-06-01",
        endDate: "2026-06-02",
        days: 2,
      }).success,
    ).toBe(true);
    expect(HcmApproveRequestBodySchema.safeParse({ note: "Looks good" }).success).toBe(true);
  });

  it("rejects invalid wire payloads", () => {
    expect(
      HcmRequestSchema.safeParse({
        id: "req_x",
        employeeId: "emp_alex",
        locationId: "ny-hq",
        startDate: "2026-06-01",
        endDate: "2026-06-02",
        days: 2,
        status: "not-a-real-status",
        submittedAt: "2026-06-01T00:00:00.000Z",
      }).success,
    ).toBe(false);
    expect(HcmSubmitRequestBodySchema.safeParse({ employeeId: "emp_alex" }).success).toBe(false);
  });
});
