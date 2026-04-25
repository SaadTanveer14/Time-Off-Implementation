/**
 * Mock clock — use `setMockNow` in tests with fake timers so scheduled ticks fire deterministically.
 */

let mockNowMs: number | null = null;

export function getNow(): number {
  return mockNowMs ?? Date.now();
}

/** Pass `null` to use real `Date.now()` again. */
export function setMockNow(ms: number | null): void {
  mockNowMs = ms;
}

export function toIso(ms: number = getNow()): string {
  return new Date(ms).toISOString();
}
