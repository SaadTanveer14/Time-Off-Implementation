"use client";

import { useCallback, useMemo } from "react";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/shared/TopBar";
import { BalanceCard } from "./BalanceCard";
import { RequestComposer } from "./RequestComposer";
import { RequestHistory } from "./RequestHistory";
import { AnniversaryToast } from "./AnniversaryToast";
import type { LocationId } from "@/lib/types";
import { employee as copyEmployee } from "@/copy";
import { useAuth } from "@/hooks/useAuth";
import { useBatchBalances } from "@/hooks/useBalances";
import { useRequests } from "@/hooks/useRequests";
import { useSubmitRequest } from "@/hooks/useSubmitRequest";
import { useCancelRequest } from "@/hooks/useCancelRequest";
import { useReconciliationLoop } from "@/hooks/useReconciliationLoop";
import {
  buildBalancesForEmployeeView,
  mapHcmRequestToTimeOffRequest,
} from "@/lib/map-hcm-to-ui";
import { useDriftNotificationsStore } from "@/state/drift-notifications.store";

export function EmployeeView() {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const batchQuery = useBatchBalances(auth.employeeId);
  const requestsQuery = useRequests(auth.employeeId);
  useReconciliationLoop(auth.employeeId);
  const submitMutation = useSubmitRequest(auth.employeeId);
  const cancelMutation = useCancelRequest();

  const submitMutating =
    useIsMutating({ mutationKey: ["submit-request", auth.employeeId] }) > 0;
  const submitVars = submitMutation.variables as { locationId?: string } | undefined;
  const submitLocationId = submitVars?.locationId;

  const locationNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of batchQuery.data?.balances ?? []) {
      map.set(row.locationId, row.locationName);
    }
    return map;
  }, [batchQuery.data]);

  const requestsUi = useMemo(
    () =>
      (requestsQuery.data ?? []).map((r) =>
        mapHcmRequestToTimeOffRequest(r, auth.employeeName, locationNameById),
      ),
    [requestsQuery.data, auth.employeeName, locationNameById],
  );

  const balancesUi = useMemo(
    () =>
      buildBalancesForEmployeeView({
        employeeId: auth.employeeId,
        primaryLocationId: auth.employeePrimaryLocationId,
        batch: batchQuery.data,
        dataUpdatedAt: batchQuery.dataUpdatedAt,
        isPending: batchQuery.isPending,
        isFetching: batchQuery.isFetching,
        isError: batchQuery.isError,
        queryClient,
        submitMutationIsPending: submitMutating,
        submitLocationId,
      }),
    [
      auth.employeeId,
      auth.employeePrimaryLocationId,
      batchQuery.data,
      batchQuery.dataUpdatedAt,
      batchQuery.isPending,
      batchQuery.isFetching,
      batchQuery.isError,
      queryClient,
      submitMutating,
      submitLocationId,
    ],
  );

  const availableByLocation: Record<LocationId, number> = useMemo(() => {
    return balancesUi.reduce(
      (acc, b) => {
        acc[b.locationId] = b.days;
        return acc;
      },
      {} as Record<LocationId, number>,
    );
  }, [balancesUi]);

  const handleSubmit = useCallback(
    (input: {
      locationId: LocationId;
      startDate: string;
      endDate: string;
      days: number;
      note?: string;
    }) => {
      submitMutation.mutate({
        employeeId: auth.employeeId,
        locationId: input.locationId,
        startDate: input.startDate,
        endDate: input.endDate,
        days: input.days,
        note: input.note,
      });
    },
    [submitMutation, auth.employeeId],
  );

  const handleCancel = useCallback(
    (id: string) => {
      cancelMutation.mutate({ employeeId: auth.employeeId, requestId: id });
    },
    [cancelMutation, auth.employeeId],
  );

  const anniversaryDrift = useDriftNotificationsStore((s) =>
    s.notifications.find((n) => n.category === "anniversary_bonus"),
  );
  const dismissDrift = useDriftNotificationsStore((s) => s.dismiss);

  const heroBalance = balancesUi.find((b) => b.isPrimary) ?? balancesUi[0];
  const otherBalances = balancesUi.filter((b) => b !== heroBalance);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <TopBar
        variant="employee"
        userName={auth.employeeName}
        userInitials={auth.employeeInitials}
        userRole={auth.employeeRole}
      />

      <main className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-20 py-12">
        <header className="mb-10">
          <p className="text-[14px] font-semibold uppercase tracking-[2px] text-violet-600">
            {copyEmployee.pageEyebrow(auth.employeeName.split(" ")[0] ?? auth.employeeName)}
          </p>
          <h1 className="mt-2 text-[40px] sm:text-[56px] font-extrabold tracking-[-1.5px] text-[#0F0B1E] leading-[1.05]">
            {copyEmployee.pageTitle}
          </h1>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
          {heroBalance && (
            <div className="lg:col-span-1">
              <BalanceCard balance={heroBalance} size="hero" />
            </div>
          )}
          {otherBalances.map((b) => (
            <BalanceCard key={b.locationId} balance={b} />
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <RequestComposer
              availableByLocation={availableByLocation}
              requests={requestsUi}
              onSubmit={handleSubmit}
              submitting={submitMutation.isPending}
            />
          </div>
          <div className="lg:col-span-3">
            <RequestHistory requests={requestsUi} onCancel={handleCancel} />
          </div>
        </section>
      </main>

      {anniversaryDrift && (
        <AnniversaryToast
          locationName={anniversaryDrift.locationName || copyEmployee.anniversaryLocationFallback}
          daysAdded={Math.max(1, anniversaryDrift.delta)}
          onDismiss={() => dismissDrift(anniversaryDrift.id)}
        />
      )}
    </div>
  );
}
