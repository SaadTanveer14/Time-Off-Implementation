"use client";

import { useQuery } from "@tanstack/react-query";
import { getBalance, getBatchBalances } from "@/lib/hcm-client";
import { qk } from "@/lib/query-keys";
import { balanceQueryDefaults, batchBalancesQueryDefaults } from "@/lib/query-client";

export function useBalance(employeeId: string, locationId: string) {
  return useQuery({
    queryKey: qk.balance(employeeId, locationId),
    queryFn: () => getBalance(employeeId, locationId),
    ...balanceQueryDefaults,
    enabled: Boolean(employeeId && locationId),
  });
}

export function useBatchBalances(employeeId: string) {
  return useQuery({
    queryKey: qk.batchBalances(employeeId),
    queryFn: () => getBatchBalances(employeeId),
    ...batchBalancesQueryDefaults,
    enabled: Boolean(employeeId),
  });
}
