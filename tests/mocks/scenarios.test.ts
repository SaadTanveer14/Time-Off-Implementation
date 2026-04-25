import { describe, expect, it } from "vitest";
import { partialFail, rateLimitAfter, silentFailOnce } from "@/mocks/hcm/scenarios";
import { getMockState } from "@/mocks/hcm/state";

describe("mock scenarios", () => {
  it("rateLimitAfter returns 429 after limit", async () => {
    rateLimitAfter(2, 60_000);
    const url = "http://localhost/api/hcm/balances?employeeId=emp_alex&locationId=ny-hq";
    expect((await fetch(url)).status).toBe(200);
    expect((await fetch(url)).status).toBe(200);
    expect((await fetch(url)).status).toBe(429);
  });

  it("partialFail omits cells from batch response", async () => {
    partialFail(["emp_alex|remote"]);
    const res = await fetch("http://localhost/api/hcm/balances/all?employeeId=emp_alex");
    expect(res.status).toBe(200);
    const body = await res.json();
    const ids = body.balances.map((b: { locationId: string }) => b.locationId);
    expect(ids).toContain("ny-hq");
    expect(ids).not.toContain("remote");
  });

  it("silentFailOnce skips mutating cancel", async () => {
    silentFailOnce();
    const pending = [...getMockState().requests.values()].find((r) => r.status === "pending-approval");
    expect(pending).toBeDefined();

    const res = await fetch(`http://localhost/api/hcm/requests/${pending!.id}`, { method: "DELETE" });
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.status).toBe("ok");

    const again = getMockState().requests.get(pending!.id);
    expect(again?.status).toBe("pending-approval");
  });
});
