import { beforeEach, describe, expect, it } from "vitest";
import { CircuitOpenError } from "@/lib/circuit-breaker";
import { useCircuitBreakerStore } from "@/state/circuit-breaker.store";

describe("circuit-breaker.store", () => {
  beforeEach(() => {
    useCircuitBreakerStore.getState().reset({
      now: () => 0,
      minSamples: 2,
      errorRateThreshold: 0.5,
      openCooldownMs: 1_000,
    });
  });

  it("tracks state transitions from underlying breaker", () => {
    useCircuitBreakerStore.getState().recordFailure();
    useCircuitBreakerStore.getState().recordFailure();
    expect(useCircuitBreakerStore.getState().state).toBe("open");
    expect(() => useCircuitBreakerStore.getState().probe()).toThrow(CircuitOpenError);
  });
});
