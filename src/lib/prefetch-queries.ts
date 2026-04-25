import type { QueryClient } from "@tanstack/react-query";
import { getBatchBalances, getPendingRequests, getRequests } from "@/lib/hcm-client";
import { qk } from "@/lib/query-keys";
import type { HcmBatchBalancesResponse } from "@/lib/types";
import {
  batchBalancesQueryDefaults,
  requestsByEmployeeQueryDefaults,
  requestsPendingForManagerQueryDefaults,
} from "@/lib/query-client";

/**
 * Warm per-location balance cache from batch so reconciliation and approve
 * preflight see cells without an extra round trip.
 */
function seedBalanceCellsFromBatch(queryClient: QueryClient, employeeId: string): void {
  const data = queryClient.getQueryData<HcmBatchBalancesResponse>(qk.batchBalances(employeeId));
  if (!data) return;
  for (const row of data.balances) {
    queryClient.setQueryData(qk.balance(employeeId, row.locationId), {
      employeeId,
      locationId: row.locationId,
      locationName: row.locationName,
      available: row.available,
      accrualRate: row.accrualRate,
      updatedAt: row.updatedAt,
    });
  }
}

export async function prefetchEmployeeTimeOff(queryClient: QueryClient, employeeId: string): Promise<void> {
  try {
    await queryClient.prefetchQuery({
      queryKey: qk.batchBalances(employeeId),
      queryFn: () => getBatchBalances(employeeId),
      ...batchBalancesQueryDefaults,
    });
    seedBalanceCellsFromBatch(queryClient, employeeId);
    await queryClient.prefetchQuery({
      queryKey: qk.requestsByEmployee(employeeId),
      queryFn: () => getRequests(employeeId),
      ...requestsByEmployeeQueryDefaults,
    });
  } catch (err) {
    console.error("[prefetch] employee time off", err);
  }
}

export async function prefetchManagerPending(queryClient: QueryClient, managerId: string): Promise<void> {
  try {
    await queryClient.prefetchQuery({
      queryKey: qk.requestsPendingForManager(managerId),
      queryFn: () => getPendingRequests(managerId),
      ...requestsPendingForManagerQueryDefaults,
    });
  } catch (err) {
    console.error("[prefetch] manager pending", err);
  }
}
