import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { categorizeDrift, diffAgainstCache } from "@/lib/reconciliation";
import type { HcmBalanceCell, HcmBatchBalancesResponse } from "@/schemas/hcm";

describe("reconciliation", () => {
  it("diffs fresh batch rows against cache cells", () => {
    const qc = new QueryClient();
    const prev: HcmBalanceCell = {
      employeeId: "emp_alex",
      locationId: "ny-hq",
      locationName: "New York HQ",
      available: 10,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    qc.setQueryData(qk.balance("emp_alex", "ny-hq"), prev);

    const fresh: HcmBatchBalancesResponse = {
      employeeId: "emp_alex",
      corpusVersion: 2,
      balances: [
        {
          locationId: "ny-hq",
          locationName: "New York HQ",
          available: 11,
          updatedAt: "2026-01-01T00:01:00.000Z",
        },
      ],
    };

    const diffs = diffAgainstCache(qc, fresh);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.delta).toBe(1);
    expect(diffs[0]?.previousAvailable).toBe(10);
  });

  it("categorizes anniversary bonus and year-start reset", () => {
    const base = {
      employeeId: "emp_alex",
      locationId: "ny-hq",
      locationName: "New York HQ",
      previousAvailable: 10,
      nextAvailable: 11,
      delta: 1,
      previous: null,
      next: {
        employeeId: "emp_alex",
        locationId: "ny-hq",
        locationName: "New York HQ",
        available: 11,
        updatedAt: "2026-04-24T10:00:00.000Z",
      },
    } as const;

    expect(
      categorizeDrift(base, {
        nowMs: Date.parse("2026-04-24T12:00:00.000Z"),
        anniversaryDate: "2020-04-24",
      }),
    ).toBe("anniversary_bonus");

    expect(
      categorizeDrift({ ...base, delta: -4, nextAvailable: 6 }, { nowMs: Date.parse("2026-01-01T00:00:00.000Z") }),
    ).toBe("year_start_reset");
  });
});
