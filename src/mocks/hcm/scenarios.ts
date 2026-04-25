import type { HttpHandler } from "msw";
import { getNow } from "./clock";
import {
  defaultScenarioFlags,
  mergeScenarioFlags,
  mockScenarioFlags,
  resetScenarioFlags,
  type RejectInsufficientTarget,
  type RejectInvalidDimensionTarget,
} from "./scenario-flags";
import { applyExternalBalanceEdit, resetMockState } from "./state";

function happyPathCore(): HttpHandler[] {
  resetScenarioFlags();
  return [];
}

function happyPathDelayed(ms: number): HttpHandler[] {
  mergeScenarioFlags({ latency: { kind: "fixed", ms } });
  return [];
}

function happyPathVerbose(): HttpHandler[] {
  mergeScenarioFlags({ verbose: true, latency: defaultScenarioFlags.latency });
  return [];
}

/** Baseline latency and flags; use `.delayed(ms)` / `.verbose()` for variants. */
export const happyPath = Object.assign(happyPathCore, {
  delayed: happyPathDelayed,
  verbose: happyPathVerbose,
});

export function offline(): HttpHandler[] {
  mergeScenarioFlags({ offline: true });
  return [];
}

export function rateLimitAfter(limit: number, windowMs: number): HttpHandler[] {
  mergeScenarioFlags({
    rateLimit: { windowStart: getNow(), count: 0, windowMs, limit },
  });
  return [];
}

export function silentFailRate(rate: number): HttpHandler[] {
  mergeScenarioFlags({ silentFailRate: Math.min(1, Math.max(0, rate)) });
  return [];
}

export function silentFailOnce(): HttpHandler[] {
  mergeScenarioFlags({ silentFailOnce: true });
  return [];
}

export function rejectInsufficientAt(target: RejectInsufficientTarget): HttpHandler[] {
  mergeScenarioFlags({ rejectInsufficientAt: target });
  return [];
}

export function rejectInvalidDimensionAt(target: RejectInvalidDimensionTarget): HttpHandler[] {
  mergeScenarioFlags({ rejectInvalidDimensionAt: target });
  return [];
}

export function anniversaryTickAt(msFromNow: number, employeeId = "emp_alex"): HttpHandler[] {
  mergeScenarioFlags({
    anniversaryTicks: [...mockScenarioFlags.anniversaryTicks, { fireAt: getNow() + msFromNow, employeeId }],
  });
  return [];
}

export function yearStartAt(msFromNow: number): HttpHandler[] {
  mergeScenarioFlags({ yearStartTick: { fireAt: getNow() + msFromNow } });
  return [];
}

export function conflictOnApprove(requestId: string): HttpHandler[] {
  mergeScenarioFlags({ conflictOnApproveRequestId: requestId });
  return [];
}

export function conflictOnApproveOnce(): HttpHandler[] {
  mergeScenarioFlags({ conflictOnApproveOnce: true });
  return [];
}

export function externalBalanceEdit(
  cell: { employeeId: string; locationId: string },
  delta: number,
): HttpHandler[] {
  applyExternalBalanceEdit(cell.employeeId, cell.locationId, delta);
  return [];
}

export function hcmMaintenance(): HttpHandler[] {
  mergeScenarioFlags({ maintenanceUntil: getNow() + 10_000 });
  return [];
}

/** Keys must be `${employeeId}|${locationId}`. */
export function partialFail(cells: string[]): HttpHandler[] {
  mergeScenarioFlags({ partialFailCells: new Set(cells) });
  return [];
}

export function circuitOpen(closeAfterMs: number): HttpHandler[] {
  mergeScenarioFlags({ circuit500Until: getNow() + closeAfterMs });
  return [];
}

export function slowBatch(ms: number): HttpHandler[] {
  mergeScenarioFlags({ slowBatchExtraMs: ms });
  return [];
}

/**
 * Reset mock state + scenario flags, then apply scenario builders in order.
 * Each builder returns MSW handlers (usually empty); flags are the primary side effect.
 */
export function compose(...builders: Array<() => HttpHandler[]>): HttpHandler[] {
  resetMockState();
  return builders.flatMap((b) => b());
}
