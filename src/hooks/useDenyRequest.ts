"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { denyRequest } from "@/lib/hcm-client";
import { qk } from "@/lib/query-keys";

type DenyVars = { managerId: string; requestId: string; reason: string; employeeId?: string; locationId?: string };

export function useDenyRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["deny-request"],
    mutationFn: ({ requestId, reason }: DenyVars) => denyRequest(requestId, reason),
    onSettled: async (_data, _error, vars) => {
      await queryClient.invalidateQueries({ queryKey: qk.requestsPendingForManager(vars.managerId) });
      await queryClient.invalidateQueries({ queryKey: qk.request(vars.requestId) });
      if (vars.employeeId) {
        await queryClient.invalidateQueries({ queryKey: qk.requestsByEmployee(vars.employeeId) });
      }
    },
  });
}
