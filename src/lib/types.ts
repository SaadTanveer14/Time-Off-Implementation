// ---- Domain types ----

export type LocationId = "ny-hq" | "remote" | "sf";

export interface Location {
  id: LocationId;
  name: string;
  shortName: string;
}

export type BalanceCardState =
  | "loading"
  | "loaded-fresh"
  | "loaded-stale"
  | "optimistic-pending"
  | "optimistic-rolled-back"
  | "optimistic-confirmed"
  | "anniversary-bonus"
  | "reconciled"
  | "error";

export interface Balance {
  locationId: LocationId;
  locationName: string;
  days: number;
  syncedAt: number; // epoch ms
  accrualPerMonth?: number;
  state: BalanceCardState;
  previousDays?: number; // for optimistic transitions
  isPrimary?: boolean;
}

export type RequestStatus =
  | "submitting"
  | "pending"
  | "approved"
  | "denied"
  | "cancelled";

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  locationId: LocationId;
  locationName: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  days: number;
  status: RequestStatus;
  note?: string;
  submittedAt: number;
  decidedAt?: number;
  optimistic?: boolean;
}

export interface PendingApproval extends TimeOffRequest {
  employeeAvatarColor: string;
  employeeRole: string;
  freshBalanceDays: number;
  freshBalanceReadAt: number;
}

export interface Employee {
  id: string;
  name: string;
  initials: string;
  role: string;
  primaryLocationId: LocationId;
  avatarColor: string;
}
