export type CircuitState = "closed" | "open" | "half-open";

export class CircuitOpenError extends Error {
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super("Circuit breaker is open");
    this.name = "CircuitOpenError";
    this.retryAfterMs = retryAfterMs;
  }
}

type Outcome = { ts: number; ok: boolean };

export type CircuitBreakerOptions = {
  windowMs?: number;
  openCooldownMs?: number;
  minSamples?: number;
  errorRateThreshold?: number;
  now?: () => number;
};

export type CircuitProbeResult = { allowed: boolean; state: CircuitState };

export type CircuitBreaker = {
  probe: () => CircuitProbeResult;
  recordSuccess: () => void;
  recordFailure: () => void;
  getState: () => CircuitState;
};

export function createCircuitBreaker(options: CircuitBreakerOptions = {}): CircuitBreaker {
  const windowMs = options.windowMs ?? 30_000;
  const openCooldownMs = options.openCooldownMs ?? 60_000;
  const minSamples = options.minSamples ?? 2;
  const errorRateThreshold = options.errorRateThreshold ?? 0.5;
  const now = options.now ?? (() => Date.now());

  let state: CircuitState = "closed";
  let openedAtMs: number | null = null;
  let outcomes: Outcome[] = [];

  function prune(nowMs: number): void {
    const cutoff = nowMs - windowMs;
    outcomes = outcomes.filter((o) => o.ts >= cutoff);
  }

  function maybeOpen(nowMs: number): void {
    prune(nowMs);
    if (outcomes.length < minSamples) return;
    const failures = outcomes.reduce((n, o) => n + (o.ok ? 0 : 1), 0);
    const rate = failures / outcomes.length;
    if (rate >= errorRateThreshold) {
      state = "open";
      openedAtMs = nowMs;
    }
  }

  return {
    probe(): CircuitProbeResult {
      const t = now();
      if (state === "closed") return { allowed: true, state };
      if (state === "open") {
        const opened = openedAtMs ?? t;
        const elapsed = t - opened;
        if (elapsed >= openCooldownMs) {
          state = "half-open";
          return { allowed: true, state };
        }
        throw new CircuitOpenError(openCooldownMs - elapsed);
      }
      return { allowed: true, state };
    },

    recordSuccess(): void {
      const t = now();
      outcomes.push({ ts: t, ok: true });
      prune(t);
      if (state === "half-open") {
        state = "closed";
        openedAtMs = null;
      }
    },

    recordFailure(): void {
      const t = now();
      outcomes.push({ ts: t, ok: false });
      prune(t);
      if (state === "half-open") {
        state = "open";
        openedAtMs = t;
        return;
      }
      if (state === "closed") {
        maybeOpen(t);
      }
    },

    getState(): CircuitState {
      return state;
    },
  };
}
