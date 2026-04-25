import type {
  Balance,
  Employee,
  Location,
  PendingApproval,
  TimeOffRequest,
} from "@/lib/types";

// ----- Authenticated user (employee view) -----
export const currentEmployee: Employee = {
  id: "emp_alex",
  name: "Alex Rivera",
  initials: "AR",
  role: "Senior Engineer",
  primaryLocationId: "ny-hq",
  avatarColor: "#EDE9FE",
};

// ----- Authenticated user (manager view) -----
export const currentManager: Employee = {
  id: "mgr_maya",
  name: "Maya Khan",
  initials: "MK",
  role: "Engineering Manager",
  primaryLocationId: "ny-hq",
  avatarColor: "#F59E0B",
};

// ----- Locations -----
export const locations: Location[] = [
  { id: "ny-hq", name: "New York HQ", shortName: "NY HQ" },
  { id: "remote", name: "Remote", shortName: "Remote" },
  { id: "sf", name: "San Francisco", shortName: "SF" },
];

// ----- Initial balances for the employee -----
const now = Date.now();

export const initialBalances: Balance[] = [
  {
    locationId: "ny-hq",
    locationName: "New York HQ",
    days: 10,
    syncedAt: now - 5_000,
    accrualPerMonth: 1.5,
    state: "loaded-fresh",
    isPrimary: true,
  },
  {
    locationId: "remote",
    locationName: "Remote",
    days: 4,
    syncedAt: now - 12_000,
    accrualPerMonth: 0.5,
    state: "loaded-fresh",
  },
  {
    locationId: "sf",
    locationName: "San Francisco",
    days: 8,
    syncedAt: now - 8 * 60_000,
    accrualPerMonth: 1,
    state: "loaded-stale",
  },
];

// ----- Initial request history (employee) -----
export const initialRequests: TimeOffRequest[] = [
  {
    id: "req_001",
    employeeId: "emp_alex",
    employeeName: "Alex Rivera",
    locationId: "ny-hq",
    locationName: "New York HQ",
    startDate: "2026-05-02",
    endDate: "2026-05-03",
    days: 2,
    status: "pending",
    note: "Long weekend with family",
    submittedAt: now - 2 * 24 * 3600_000,
  },
  {
    id: "req_002",
    employeeId: "emp_alex",
    employeeName: "Alex Rivera",
    locationId: "ny-hq",
    locationName: "New York HQ",
    startDate: "2026-04-17",
    endDate: "2026-04-20",
    days: 4,
    status: "approved",
    submittedAt: now - 14 * 24 * 3600_000,
    decidedAt: now - 13 * 24 * 3600_000,
  },
  {
    id: "req_003",
    employeeId: "emp_alex",
    employeeName: "Alex Rivera",
    locationId: "remote",
    locationName: "Remote",
    startDate: "2026-04-01",
    endDate: "2026-04-02",
    days: 2,
    status: "denied",
    submittedAt: now - 28 * 24 * 3600_000,
    decidedAt: now - 27 * 24 * 3600_000,
  },
  {
    id: "req_004",
    employeeId: "emp_alex",
    employeeName: "Alex Rivera",
    locationId: "ny-hq",
    locationName: "New York HQ",
    startDate: "2026-03-20",
    endDate: "2026-03-20",
    days: 1,
    status: "cancelled",
    submittedAt: now - 40 * 24 * 3600_000,
    decidedAt: now - 39 * 24 * 3600_000,
  },
];

// ----- Pending approvals (manager view) -----
export const pendingApprovals: PendingApproval[] = [
  {
    id: "req_p001",
    employeeId: "emp_alex",
    employeeName: "Alex Rivera",
    employeeAvatarColor: "#EDE9FE",
    employeeRole: "Senior Engineer · New York HQ",
    locationId: "ny-hq",
    locationName: "New York HQ",
    startDate: "2026-05-05",
    endDate: "2026-05-08",
    days: 3,
    status: "pending",
    note: "Taking my mom to visit her sister in Boston. Sprint work is handed off to Priya.",
    submittedAt: now - 18 * 3600_000,
    freshBalanceDays: 10,
    freshBalanceReadAt: now - 2_000,
  },
  {
    id: "req_p002",
    employeeId: "emp_jordan",
    employeeName: "Jordan Lee",
    employeeAvatarColor: "#FEF3C7",
    employeeRole: "Software Engineer · Remote",
    locationId: "remote",
    locationName: "Remote",
    startDate: "2026-04-29",
    endDate: "2026-04-29",
    days: 1,
    status: "pending",
    note: "Doctor's appointment.",
    submittedAt: now - 10 * 3600_000,
    freshBalanceDays: 4,
    freshBalanceReadAt: now - 4_000,
  },
  {
    id: "req_p003",
    employeeId: "emp_sam",
    employeeName: "Sam Chen",
    employeeAvatarColor: "#DBEAFE",
    employeeRole: "Designer · San Francisco",
    locationId: "sf",
    locationName: "San Francisco",
    startDate: "2026-05-12",
    endDate: "2026-05-20",
    days: 7,
    status: "pending",
    note: "Already booked, hoping it works out!",
    submittedAt: now - 6 * 3600_000,
    freshBalanceDays: 4,
    freshBalanceReadAt: now - 6_000,
  },
  {
    id: "req_p004",
    employeeId: "emp_priya",
    employeeName: "Priya Kumar",
    employeeAvatarColor: "#EDE9FE",
    employeeRole: "Senior Engineer · New York HQ",
    locationId: "ny-hq",
    locationName: "New York HQ",
    startDate: "2026-06-03",
    endDate: "2026-06-07",
    days: 5,
    status: "pending",
    note: "Family wedding.",
    submittedAt: now - 2 * 3600_000,
    freshBalanceDays: 12,
    freshBalanceReadAt: now - 8_000,
  },
];
