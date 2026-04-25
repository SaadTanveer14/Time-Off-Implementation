/**
 * Canonical TanStack Query keys (TRD §9.2 / IMPLEMENTATION_PLAN Phase 3).
 * Hierarchical tuples so invalidation can target a subtree (e.g. all balances).
 */

export const qk = {
  all: ["hcm"] as const,

  balances: () => [...qk.all, "balances"] as const,

  balance: (employeeId: string, locationId: string) =>
    [...qk.balances(), employeeId, locationId] as const,

  batchBalances: (employeeId: string) =>
    [...qk.balances(), "batch", employeeId] as const,

  requests: () => [...qk.all, "requests"] as const,

  requestsByEmployee: (employeeId: string) =>
    [...qk.requests(), "by-employee", employeeId] as const,

  requestsPendingForManager: (managerId: string) =>
    [...qk.requests(), "pending-for-manager", managerId] as const,

  request: (requestId: string) =>
    [...qk.requests(), "single", requestId] as const,
} as const;
