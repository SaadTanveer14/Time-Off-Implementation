import { create } from "zustand";
import {
  createCircuitBreaker,
  CircuitOpenError,
  type CircuitBreaker,
  type CircuitBreakerOptions,
  type CircuitProbeResult,
  type CircuitState,
} from "@/lib/circuit-breaker";

type CircuitBreakerStoreState = {
  state: CircuitState;
  breaker: CircuitBreaker;
  probe: () => CircuitProbeResult;
  recordSuccess: () => void;
  recordFailure: () => void;
  reset: (options?: CircuitBreakerOptions) => void;
};

function makeStoreBreaker(options?: CircuitBreakerOptions): CircuitBreaker {
  return createCircuitBreaker(options);
}

export const useCircuitBreakerStore = create<CircuitBreakerStoreState>((set, get) => ({
  breaker: makeStoreBreaker(),
  state: "closed",
  probe: () => {
    try {
      const result = get().breaker.probe();
      set({ state: get().breaker.getState() });
      return result;
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        set({ state: get().breaker.getState() });
      }
      throw error;
    }
  },
  recordSuccess: () => {
    get().breaker.recordSuccess();
    set({ state: get().breaker.getState() });
  },
  recordFailure: () => {
    get().breaker.recordFailure();
    set({ state: get().breaker.getState() });
  },
  reset: (options) => {
    const breaker = makeStoreBreaker(options);
    set({ breaker, state: breaker.getState() });
  },
}));
