/**
 * Runtime scenario flags read by MSW handlers. Mutators live in `scenarios.ts`.
 * Reset together with mock state in tests and Storybook.
 */

export type LatencyConfig =
  | { kind: "range"; minMs: number; maxMs: number }
  | { kind: "fixed"; ms: number };

export type RejectInsufficientTarget = {
  employeeId: string;
  locationId: string;
  days: number;
};

export type RejectInvalidDimensionTarget = {
  employeeId: string;
  locationId: string;
};

export interface MockScenarioFlags {
  latency: LatencyConfig;
  offline: boolean;
  silentFailRate: number;
  silentFailOnce: boolean;
  rejectInsufficientAt: RejectInsufficientTarget | null;
  rejectInvalidDimensionAt: RejectInvalidDimensionTarget | null;
  anniversaryTicks: Array<{ fireAt: number; employeeId: string }>;
  yearStartTick: { fireAt: number } | null;
  conflictOnApproveRequestId: string | null;
  conflictOnApproveOnce: boolean;
  maintenanceUntil: number | null;
  /** `${employeeId}|${locationId}` keys omitted from batch GET (still 200). */
  partialFailCells: Set<string>;
  /** Until this time, handlers return 500 (circuit storm). */
  circuit500Until: number | null;
  /** Extra delay only for GET balances/all. */
  slowBatchExtraMs: number;
  verbose: boolean;
  rateLimit: {
    windowStart: number;
    count: number;
    windowMs: number;
    limit: number;
  } | null;
}

const happyLatency: LatencyConfig = { kind: "range", minMs: 100, maxMs: 300 };

export const defaultScenarioFlags: MockScenarioFlags = {
  latency: happyLatency,
  offline: false,
  silentFailRate: 0,
  silentFailOnce: false,
  rejectInsufficientAt: null,
  rejectInvalidDimensionAt: null,
  anniversaryTicks: [],
  yearStartTick: null,
  conflictOnApproveRequestId: null,
  conflictOnApproveOnce: false,
  maintenanceUntil: null,
  partialFailCells: new Set(),
  circuit500Until: null,
  slowBatchExtraMs: 0,
  verbose: false,
  rateLimit: null,
};

export let mockScenarioFlags: MockScenarioFlags = cloneFlags(defaultScenarioFlags);

function cloneFlags(f: MockScenarioFlags): MockScenarioFlags {
  return {
    ...f,
    partialFailCells: new Set(f.partialFailCells),
    anniversaryTicks: [...f.anniversaryTicks],
  };
}

export function resetScenarioFlags(): void {
  mockScenarioFlags = cloneFlags(defaultScenarioFlags);
}

export function mergeScenarioFlags(partial: Partial<MockScenarioFlags>): void {
  mockScenarioFlags = {
    ...mockScenarioFlags,
    ...partial,
    partialFailCells:
      partial.partialFailCells !== undefined
        ? new Set(partial.partialFailCells)
        : new Set(mockScenarioFlags.partialFailCells),
    anniversaryTicks:
      partial.anniversaryTicks !== undefined
        ? [...partial.anniversaryTicks]
        : [...mockScenarioFlags.anniversaryTicks],
  };
}
