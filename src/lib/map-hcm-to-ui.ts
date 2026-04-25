import type { QueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import type {
  Balance,
  BalanceCardState,
  HcmBalanceCell,
  HcmBatchBalancesResponse,
  HcmRequest,
  LocationId,
  PendingApproval,
  RequestStatus,
  TimeOffRequest,
} from "@/lib/types";
import { LocationIdSchema } from "@/lib/types";
import { getEmployeeDisplay } from "@/lib/employee-display-registry";
import { locations } from "@/lib/locations";

const FRESH_MS = 60_000;

function parseLocationId(raw: string): LocationId {
  const parsed = LocationIdSchema.safeParse(raw);
  return parsed.success ? parsed.data : "ny-hq";
}

function hcmStatusToUiStatus(status: HcmRequest["status"]): RequestStatus {
  switch (status) {
    case "draft":
      return "pending";
    case "pending-submit":
      return "submitting";
    case "pending-approval":
      return "pending";
    case "approved":
      return "approved";
    case "denied":
      return "denied";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

export function mapHcmRequestToTimeOffRequest(
  r: HcmRequest,
  employeeName: string,
  locationNameByLocationId: Map<string, string>,
): TimeOffRequest {
  const locationId = parseLocationId(r.locationId);
  return {
    id: r.id,
    employeeId: r.employeeId,
    employeeName,
    locationId,
    locationName: locationNameByLocationId.get(r.locationId) ?? locationNameByLocationId.get(locationId) ?? "",
    startDate: r.startDate,
    endDate: r.endDate,
    days: r.days,
    status: hcmStatusToUiStatus(r.status),
    note: r.note,
    submittedAt: Date.parse(r.submittedAt),
    decidedAt: r.decidedAt ? Date.parse(r.decidedAt) : undefined,
    optimistic: r.status === "pending-submit",
  };
}

export function buildBalancesForEmployeeView(input: {
  employeeId: string;
  primaryLocationId: LocationId;
  batch: HcmBatchBalancesResponse | undefined;
  dataUpdatedAt: number;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  queryClient: QueryClient;
  submitMutationIsPending: boolean;
  submitLocationId: string | undefined;
}): Balance[] {
  const {
    employeeId,
    primaryLocationId,
    batch,
    dataUpdatedAt,
    isPending,
    isFetching,
    isError,
    queryClient,
    submitMutationIsPending,
    submitLocationId,
  } = input;

  if (isError) {
    return [
      {
        locationId: primaryLocationId,
        locationName: "",
        days: 0,
        syncedAt: Date.now(),
        state: "error",
        isPrimary: true,
      },
    ];
  }

  if (isPending && !batch) {
    return (["ny-hq", "remote", "sf"] as const).map((locationId) => ({
      locationId,
      locationName: "",
      days: 0,
      syncedAt: Date.now(),
      state: "loading" as const,
      isPrimary: locationId === primaryLocationId,
    }));
  }

  if (!batch?.balances.length) {
    return [
      {
        locationId: primaryLocationId,
        locationName: "",
        days: 0,
        syncedAt: Date.now(),
        state: "loaded-fresh",
        isPrimary: true,
      },
    ];
  }

  return batch.balances.map((row) => {
    const locationId = parseLocationId(row.locationId);
    const cell = queryClient.getQueryData<HcmBalanceCell>(qk.balance(employeeId, row.locationId));
    const source = cell ?? {
      employeeId,
      locationId: row.locationId,
      locationName: row.locationName,
      available: row.available,
      accrualRate: row.accrualRate,
      updatedAt: row.updatedAt,
    };
    const days = source.available;
    const syncedAt = Date.parse(source.updatedAt);
    const rowSubmitting = Boolean(
      submitMutationIsPending && submitLocationId && parseLocationId(submitLocationId) === locationId,
    );
    const staleByTime = Date.now() - dataUpdatedAt > FRESH_MS;
    const state: BalanceCardState = rowSubmitting
      ? "optimistic-pending"
      : staleByTime || isFetching
        ? "loaded-stale"
        : "loaded-fresh";

    return {
      locationId,
      locationName: source.locationName,
      days,
      syncedAt,
      accrualPerMonth: source.accrualRate,
      state,
      isPrimary: locationId === primaryLocationId,
    } satisfies Balance;
  });
}

export function mapHcmRequestToPendingApproval(
  r: HcmRequest,
  freshCell: HcmBalanceCell | undefined,
): PendingApproval {
  const display = getEmployeeDisplay(r.employeeId);
  const locationId = parseLocationId(r.locationId);
  const readAt = freshCell ? Date.parse(freshCell.updatedAt) : Date.now();
  const freshDays = freshCell?.available ?? 0;
  const locationName =
    freshCell?.locationName ?? locations.find((l) => l.id === locationId)?.name ?? String(r.locationId);

  return {
    id: r.id,
    employeeId: r.employeeId,
    employeeName: display.name,
    employeeAvatarColor: display.avatarColor,
    employeeRole: display.role,
    locationId,
    locationName,
    startDate: r.startDate,
    endDate: r.endDate,
    days: r.days,
    status: hcmStatusToUiStatus(r.status),
    note: r.note,
    submittedAt: Date.parse(r.submittedAt),
    decidedAt: r.decidedAt ? Date.parse(r.decidedAt) : undefined,
    freshBalanceDays: freshDays,
    freshBalanceReadAt: readAt,
  };
}
