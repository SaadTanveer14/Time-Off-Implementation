"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitRequest, getBalance } from "@/lib/hcm-client";
import { qk } from "@/lib/query-keys";
import { generateIdempotencyKey } from "@/lib/idempotency";
import { createBroadcastChannel } from "@/lib/broadcast-channel";
import type { HcmBalanceCell, HcmRequest, HcmSubmitRequestBody } from "@/lib/types";
import { transition } from "@/lib/request-state-machine";
import { useRequestDraftStore } from "@/state/request-draft.store";
import { useToastQueueStore } from "@/state/toast-queue.store";

type SubmitVars = HcmSubmitRequestBody;
type SubmitCtx = {
  previousBalance?: HcmBalanceCell;
  previousRequests?: HcmRequest[];
  optimisticRequestId: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

export function useSubmitRequest(employeeId: string) {
  const queryClient = useQueryClient();
  const channel = createBroadcastChannel<{ type: "request-submitted"; employeeId: string }>("time-off-sync");

  return useMutation({
    mutationKey: ["submit-request", employeeId],
    mutationFn: async (input: SubmitVars) => {
      const idempotencyKey = generateIdempotencyKey();
      return submitRequest(input, idempotencyKey);
    },
    onMutate: async (input): Promise<SubmitCtx> => {
      const optimisticRequestId = `optimistic_${generateIdempotencyKey()}`;
      const transitionResult = transition("draft", "submit");
      if (!transitionResult.ok) {
        throw new Error("Illegal state transition while submitting request");
      }

      const balanceKey = qk.balance(employeeId, input.locationId);
      const requestsKey = qk.requestsByEmployee(employeeId);

      await queryClient.cancelQueries({ queryKey: balanceKey });
      await queryClient.cancelQueries({ queryKey: requestsKey });

      const previousBalance = queryClient.getQueryData<HcmBalanceCell>(balanceKey);
      const previousRequests = queryClient.getQueryData<HcmRequest[]>(requestsKey);

      if (previousBalance) {
        queryClient.setQueryData<HcmBalanceCell>(balanceKey, {
          ...previousBalance,
          available: Math.max(0, previousBalance.available - input.days),
          updatedAt: nowIso(),
        });
      }

      const optimisticRequest: HcmRequest = {
        id: optimisticRequestId,
        employeeId: input.employeeId,
        locationId: input.locationId,
        startDate: input.startDate,
        endDate: input.endDate,
        days: input.days,
        status: "pending-submit",
        note: input.note,
        submittedAt: nowIso(),
      };
      queryClient.setQueryData<HcmRequest[]>(requestsKey, [...(previousRequests ?? []), optimisticRequest]);

      return { previousBalance, previousRequests, optimisticRequestId };
    },
    onError: (_error, input, ctx) => {
      if (!ctx) return;
      const balanceKey = qk.balance(employeeId, input.locationId);
      const requestsKey = qk.requestsByEmployee(employeeId);
      if (ctx.previousBalance) queryClient.setQueryData(balanceKey, ctx.previousBalance);
      if (ctx.previousRequests) queryClient.setQueryData(requestsKey, ctx.previousRequests);
      useRequestDraftStore.getState().retain(60_000);
      useToastQueueStore.getState().enqueue({
        kind: "error",
        title: "Request rejected by HCM",
        body: "Your request was rolled back. Draft retained for 60 seconds.",
      });
    },
    onSuccess: async (created, input, ctx) => {
      const requestsKey = qk.requestsByEmployee(employeeId);
      const existing = queryClient.getQueryData<HcmRequest[]>(requestsKey) ?? [];
      queryClient.setQueryData<HcmRequest[]>(
        requestsKey,
        existing.map((r) => (r.id === ctx?.optimisticRequestId ? created : r)),
      );

      const verified = await getBalance(input.employeeId, input.locationId);
      queryClient.setQueryData(qk.balance(employeeId, input.locationId), verified);
      useRequestDraftStore.getState().reset();
      useToastQueueStore.getState().enqueue({
        kind: "success",
        title: "Request submitted",
        body: "Pending manager approval.",
      });
    },
    onSettled: async (_data, _error, input) => {
      await queryClient.invalidateQueries({ queryKey: qk.balance(employeeId, input.locationId) });
      await queryClient.invalidateQueries({ queryKey: qk.requestsByEmployee(employeeId) });
      channel.postMessage({ type: "request-submitted", employeeId });
    },
  });
}
