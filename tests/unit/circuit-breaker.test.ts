import { describe, expect, it } from "vitest";
import { CircuitOpenError, createCircuitBreaker } from "@/lib/circuit-breaker";

describe("circuit-breaker", () => {
  it("opens when error rate crosses threshold in sliding window", () => {
    let t = 0;
    const cb = createCircuitBreaker({ now: () => t, minSamples: 2, errorRateThreshold: 0.5 });
    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess();
    expect(() => cb.probe()).toThrow(CircuitOpenError);
    expect(cb.getState()).toBe("open");
  });

  it("moves open -> half-open after cooldown -> closed on success", () => {
    let t = 0;
    const cb = createCircuitBreaker({ now: () => t, openCooldownMs: 1000, minSamples: 2 });
    cb.recordFailure();
    cb.recordFailure();
    expect(() => cb.probe()).toThrow(CircuitOpenError);

    t = 1001;
    expect(cb.probe()).toEqual({ allowed: true, state: "half-open" });
    cb.recordSuccess();
    expect(cb.getState()).toBe("closed");
    expect(cb.probe()).toEqual({ allowed: true, state: "closed" });
  });

  it("re-opens immediately on half-open failure", () => {
    let t = 0;
    const cb = createCircuitBreaker({ now: () => t, openCooldownMs: 1000, minSamples: 2 });
    cb.recordFailure();
    cb.recordFailure();
    t = 1001;
    cb.probe();
    cb.recordFailure();
    expect(cb.getState()).toBe("open");
  });
});
