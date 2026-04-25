import { beforeEach, describe, expect, it } from "vitest";
import { useManagerFiltersStore } from "@/state/manager-filters.store";

describe("manager-filters.store", () => {
  beforeEach(() => {
    useManagerFiltersStore.setState({ filter: "pending", selectedId: "", sessionDecisions: [] });
  });

  it("updates filter and selection", () => {
    useManagerFiltersStore.getState().setFilter("approved");
    useManagerFiltersStore.getState().setSelected("req_1");
    expect(useManagerFiltersStore.getState().filter).toBe("approved");
    expect(useManagerFiltersStore.getState().selectedId).toBe("req_1");
  });

  it("records session decisions", () => {
    const req = {
      id: "r1",
      employeeId: "e1",
      employeeName: "Test",
      employeeAvatarColor: "#fff",
      employeeRole: "Eng",
      locationId: "ny-hq" as const,
      locationName: "NY",
      startDate: "2026-01-01",
      endDate: "2026-01-02",
      days: 1,
      status: "pending" as const,
      submittedAt: Date.now(),
      freshBalanceDays: 5,
      freshBalanceReadAt: Date.now(),
    };
    useManagerFiltersStore.getState().pushSessionDecision({ req, outcome: "approved" });
    expect(useManagerFiltersStore.getState().sessionDecisions).toHaveLength(1);
    expect(useManagerFiltersStore.getState().sessionDecisions[0]?.outcome).toBe("approved");
    useManagerFiltersStore.getState().resetSessionDecisions();
    expect(useManagerFiltersStore.getState().sessionDecisions).toHaveLength(0);
  });
});
