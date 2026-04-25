import { describe, expect, it } from "vitest";
import { mockScenarioFlags, mergeScenarioFlags } from "@/mocks/hcm/scenario-flags";
import { getMockState, resetMockState } from "@/mocks/hcm/state";

describe("resetMockState", () => {
  it("restores seeded requests and balances", () => {
    const before = getMockState().requests.size;
    expect(before).toBeGreaterThan(0);

    getMockState().requests.clear();
    expect(getMockState().requests.size).toBe(0);

    resetMockState();
    expect(getMockState().requests.size).toBe(before);
    expect(getMockState().balances.get("emp_alex|ny-hq")?.employeeId).toBe("emp_alex");
  });

  it("resets scenario flags", () => {
    mergeScenarioFlags({ offline: true });
    resetMockState();
    expect(mockScenarioFlags.offline).toBe(false);
  });
});
