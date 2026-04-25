"use client";

import { useQuery } from "@tanstack/react-query";
import { getPendingRequests, getRequest, getRequests } from "@/lib/hcm-client";
import { qk } from "@/lib/query-keys";
import {
  requestByIdQueryDefaults,
  requestsByEmployeeQueryDefaults,
  requestsPendingForManagerQueryDefaults,
} from "@/lib/query-client";

export function useRequests(employeeId: string) {
  return useQuery({
    queryKey: qk.requestsByEmployee(employeeId),
    queryFn: () => getRequests(employeeId),
    ...requestsByEmployeeQueryDefaults,
    enabled: Boolean(employeeId),
  });
}

export function usePendingRequests(managerId: string) {
  return useQuery({
    queryKey: qk.requestsPendingForManager(managerId),
    queryFn: () => getPendingRequests(managerId),
    ...requestsPendingForManagerQueryDefaults,
    enabled: Boolean(managerId),
  });
}

export function useRequest(requestId: string) {
  return useQuery({
    queryKey: qk.request(requestId),
    queryFn: () => getRequest(requestId),
    ...requestByIdQueryDefaults,
    enabled: Boolean(requestId),
  });
}
