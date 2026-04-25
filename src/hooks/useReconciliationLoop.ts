"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBatchBalances } from "@/lib/hcm-client";
import { qk } from "@/lib/query-keys";
import { batchBalancesQueryDefaults } from "@/lib/query-client";
import { categorizeDrift, diffAgainstCache, type DriftCategory } from "@/lib/reconciliation";
import { useDriftNotificationsStore } from "@/state/drift-notifications.store";

type DriftNotifier = (payload: {
  employeeId: string;
  locationId: string;
  locationName: string;
  delta: number;
  category: DriftCategory;
}) => void;

function noopNotifyDrift(_: Parameters<DriftNotifier>[0]): void {
  useDriftNotificationsStore.getState().enqueue(_);
}

export function useReconciliationLoop(
  employeeId: string,
  options?: { notifyDrift?: DriftNotifier },
) {
  const queryClient = useQueryClient();
  const notifyDrift = options?.notifyDrift ?? noopNotifyDrift;

  const query = useQuery({
    queryKey: qk.batchBalances(employeeId),
    queryFn: () => getBatchBalances(employeeId),
    ...batchBalancesQueryDefaults,
    enabled: Boolean(employeeId),
  });

  useEffect(() => {
    if (!query.data) return;
    const diffs = diffAgainstCache(queryClient, query.data);
    for (const d of diffs) {
      queryClient.setQueryData(qk.balance(d.employeeId, d.locationId), d.next);
      const category = categorizeDrift(d);
      notifyDrift({
        employeeId: d.employeeId,
        locationId: d.locationId,
        locationName: d.locationName,
        delta: d.delta,
        category,
      });
    }
  }, [query.data, notifyDrift, queryClient]);

  return query;
}
