"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelRequest } from "@/lib/hcm-client";
import { qk } from "@/lib/query-keys";
import type { HcmRequest } from "@/lib/types";
import { useToastQueueStore } from "@/state/toast-queue.store";

type CancelVars = { employeeId: string; requestId: string };
type CancelCtx = { previousRequests?: HcmRequest[] };

export function useCancelRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["cancel-request"],
    mutationFn: ({ requestId }: CancelVars) => cancelRequest(requestId),
    onMutate: async ({ employeeId, requestId }): Promise<CancelCtx> => {
      const requestsKey = qk.requestsByEmployee(employeeId);
      await queryClient.cancelQueries({ queryKey: requestsKey });
      const previousRequests = queryClient.getQueryData<HcmRequest[]>(requestsKey);
      if (previousRequests) {
        queryClient.setQueryData<HcmRequest[]>(
          requestsKey,
          previousRequests.map((r) => (r.id === requestId ? { ...r, status: "cancelled" } : r)),
        );
      }
      useToastQueueStore.getState().enqueue({
        kind: "warning",
        title: "Cancellation pending",
        body: "Undo available for 5 seconds (UI wiring in Step 9).",
      });
      return { previousRequests };
    },
    onError: (_error, vars, ctx) => {
      if (!ctx?.previousRequests) return;
      queryClient.setQueryData(qk.requestsByEmployee(vars.employeeId), ctx.previousRequests);
    },
    onSettled: async (_data, _error, vars) => {
      await queryClient.invalidateQueries({ queryKey: qk.requestsByEmployee(vars.employeeId) });
    },
  });
}
