"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveRequest, getBalance } from "@/lib/hcm-client";
import { qk } from "@/lib/query-keys";
import { useConflictModalStore } from "@/state/conflict-modal.store";

export class ConflictError extends Error {
  readonly staleBalance: number;
  readonly liveBalance: number;
  constructor(staleBalance: number, liveBalance: number) {
    super("Balance changed before approval");
    this.name = "ConflictError";
    this.staleBalance = staleBalance;
    this.liveBalance = liveBalance;
  }
}

type ApproveVars = {
  managerId: string;
  requestId: string;
  employeeId: string;
  locationId: string;
  requestedDays: number;
  staleBalance: number;
  note?: string;
};

export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["approve-request"],
    mutationFn: async (vars: ApproveVars) => {
      const fresh = await queryClient.fetchQuery({
        queryKey: qk.balance(vars.employeeId, vars.locationId),
        queryFn: () => getBalance(vars.employeeId, vars.locationId),
      });
      if (fresh.available < vars.requestedDays || fresh.available !== vars.staleBalance) {
        throw new ConflictError(vars.staleBalance, fresh.available);
      }
      return approveRequest(vars.requestId, vars.note);
    },
    onError: (error, vars) => {
      if (error instanceof ConflictError) {
        useConflictModalStore.getState().openModal({
          requestId: vars.requestId,
          staleBalance: error.staleBalance,
          liveBalance: error.liveBalance,
        });
      }
    },
    onSettled: async (_data, _error, vars) => {
      await queryClient.invalidateQueries({ queryKey: qk.balance(vars.employeeId, vars.locationId) });
      await queryClient.invalidateQueries({ queryKey: qk.requestsPendingForManager(vars.managerId) });
      await queryClient.invalidateQueries({ queryKey: qk.request(vars.requestId) });
    },
  });
}
