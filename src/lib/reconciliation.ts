import type { QueryClient } from "@tanstack/react-query";
import type { HcmBatchBalancesResponse, HcmBalanceCell } from "@/schemas/hcm";
import { qk } from "@/lib/query-keys";

export type BalanceDiff = {
  employeeId: string;
  locationId: string;
  locationName: string;
  previousAvailable: number | null;
  nextAvailable: number;
  delta: number;
  previous: HcmBalanceCell | null;
  next: HcmBalanceCell;
};

export type DriftCategory = "anniversary_bonus" | "year_start_reset" | "unknown";

export type DriftMetadata = {
  nowMs?: number;
  anniversaryDate?: string;
  policyDefaultAvailable?: number;
};

export function diffAgainstCache(
  queryClient: QueryClient,
  fresh: HcmBatchBalancesResponse,
): BalanceDiff[] {
  const diffs: BalanceDiff[] = [];

  for (const row of fresh.balances) {
    const key = qk.balance(fresh.employeeId, row.locationId);
    const prev = queryClient.getQueryData<HcmBalanceCell>(key) ?? null;
    const previousAvailable = prev?.available ?? null;
    const nextAvailable = row.available;
    if (previousAvailable === nextAvailable) continue;

    const next: HcmBalanceCell = {
      employeeId: fresh.employeeId,
      locationId: row.locationId,
      locationName: row.locationName,
      available: row.available,
      accrualRate: row.accrualRate,
      updatedAt: row.updatedAt,
    };

    diffs.push({
      employeeId: fresh.employeeId,
      locationId: row.locationId,
      locationName: row.locationName,
      previousAvailable,
      nextAvailable,
      delta: nextAvailable - (previousAvailable ?? 0),
      previous: prev,
      next,
    });
  }

  return diffs;
}

export function categorizeDrift(diff: BalanceDiff, metadata: DriftMetadata = {}): DriftCategory {
  const now = new Date(metadata.nowMs ?? Date.now());
  const isJan1 = now.getUTCMonth() === 0 && now.getUTCDate() === 1;

  if (diff.delta === 1 && metadata.anniversaryDate) {
    const [year, month, day] = metadata.anniversaryDate.split("-").map((x) => Number.parseInt(x, 10));
    void year;
    if (month === now.getUTCMonth() + 1 && day === now.getUTCDate()) {
      return "anniversary_bonus";
    }
  }

  if (isJan1) return "year_start_reset";
  if (
    metadata.policyDefaultAvailable !== undefined &&
    diff.nextAvailable === metadata.policyDefaultAvailable &&
    diff.previousAvailable !== metadata.policyDefaultAvailable
  ) {
    return "year_start_reset";
  }

  return "unknown";
}
