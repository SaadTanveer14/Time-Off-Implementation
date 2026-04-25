import { describe, expect, it, vi } from "vitest";
import {
  balanceQueryDefaults,
  batchBalancesQueryDefaults,
  makeQueryClient,
  readReconcileIntervalMs,
  requestByIdQueryDefaults,
  requestsByEmployeeQueryDefaults,
  requestsPendingForManagerQueryDefaults,
} from "@/lib/query-client";

describe("readReconcileIntervalMs", () => {
  it("defaults to 60_000 when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_RECONCILE_INTERVAL_MS", "");
    expect(readReconcileIntervalMs()).toBe(60_000);
  });

  it("parses positive integer from env", () => {
    vi.stubEnv("NEXT_PUBLIC_RECONCILE_INTERVAL_MS", "120000");
    expect(readReconcileIntervalMs()).toBe(120_000);
  });

  it("falls back on invalid value", () => {
    vi.stubEnv("NEXT_PUBLIC_RECONCILE_INTERVAL_MS", "not-a-number");
    expect(readReconcileIntervalMs()).toBe(60_000);
  });
});

describe("makeQueryClient", () => {
  it("sets refetchIntervalInBackground false on queries", () => {
    const client = makeQueryClient();
    const defaults = client.getDefaultOptions().queries;
    expect(defaults?.refetchIntervalInBackground).toBe(false);
  });
});

describe("query presets (Phase 3 table)", () => {
  it("exports expected staleTime / gcTime shapes", () => {
    expect(balanceQueryDefaults.staleTime).toBe(5000);
    expect(balanceQueryDefaults.gcTime).toBe(300_000);
    expect(batchBalancesQueryDefaults.staleTime).toBe(30_000);
    expect(batchBalancesQueryDefaults.gcTime).toBe(600_000);
    expect(batchBalancesQueryDefaults.refetchOnWindowFocus).toBe(false);
    expect(requestsByEmployeeQueryDefaults.staleTime).toBe(10_000);
    expect(requestsPendingForManagerQueryDefaults.refetchInterval).toBe(15_000);
    expect(requestByIdQueryDefaults.staleTime).toBe(5000);
  });
});
