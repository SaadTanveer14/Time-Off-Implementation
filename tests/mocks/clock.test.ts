import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getNow, setMockNow } from "@/mocks/hcm/clock";
import { anniversaryTickAt } from "@/mocks/hcm/scenarios";
import { getBalanceCell, resetMockState } from "@/mocks/hcm/state";

describe("mock clock + anniversary tick", () => {
  beforeEach(() => {
    resetMockState();
    setMockNow(new Date("2026-04-24T10:00:00.000Z").getTime());
  });

  afterEach(() => {
    setMockNow(null);
  });

  it("fires scheduled anniversary bump when time advances", async () => {
    const before = getBalanceCell("emp_alex", "ny-hq")?.available;
    expect(before).toBeDefined();

    anniversaryTickAt(60_000, "emp_alex");

    setMockNow(getNow() + 120_000);

    await fetch("http://localhost/api/hcm/balances?employeeId=emp_alex&locationId=ny-hq");

    const after = getBalanceCell("emp_alex", "ny-hq")?.available;
    expect(after).toBe((before ?? 0) + 1);
  });
});
