import { describe, expect, it } from "vitest";
import { qk } from "@/lib/query-keys";

/** True if `prefix` is a leading slice of `key` (TanStack prefix invalidation semantics). */
function isQueryKeyPrefix(
  prefix: readonly unknown[],
  key: readonly unknown[],
): boolean {
  if (prefix.length > key.length) return false;
  return prefix.every((segment, i) => segment === key[i]);
}

describe("qk hierarchy", () => {
  it("exposes stable root and segment keys", () => {
    expect(qk.all).toEqual(["hcm"]);
    expect(qk.balances()).toEqual(["hcm", "balances"]);
    expect(qk.requests()).toEqual(["hcm", "requests"]);
  });

  it("prefix-matches balance under balances() for invalidation", () => {
    const key = qk.balance("emp_alex", "ny-hq");
    expect(isQueryKeyPrefix(qk.all, key)).toBe(true);
    expect(isQueryKeyPrefix(qk.balances(), key)).toBe(true);
    expect(key).toEqual(["hcm", "balances", "emp_alex", "ny-hq"]);
  });

  it("prefix-matches batchBalances under balances()", () => {
    const key = qk.batchBalances("emp_alex");
    expect(isQueryKeyPrefix(qk.balances(), key)).toBe(true);
    expect(key).toEqual(["hcm", "balances", "batch", "emp_alex"]);
  });

  it("prefix-matches employee requests under requests()", () => {
    const key = qk.requestsByEmployee("emp_alex");
    expect(isQueryKeyPrefix(qk.requests(), key)).toBe(true);
    expect(isQueryKeyPrefix(qk.all, key)).toBe(true);
    expect(key).toEqual(["hcm", "requests", "by-employee", "emp_alex"]);
  });

  it("prefix-matches manager pending under requests()", () => {
    const key = qk.requestsPendingForManager("mgr_maya");
    expect(isQueryKeyPrefix(qk.requests(), key)).toBe(true);
    expect(key).toEqual(["hcm", "requests", "pending-for-manager", "mgr_maya"]);
  });

  it("prefix-matches single request under requests()", () => {
    const key = qk.request("req_001");
    expect(isQueryKeyPrefix(qk.requests(), key)).toBe(true);
    expect(key).toEqual(["hcm", "requests", "single", "req_001"]);
  });
});
