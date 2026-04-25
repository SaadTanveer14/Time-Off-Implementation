import { QueryClient, type QueryClientConfig } from "@tanstack/react-query";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/**
 * Batch reconciliation interval (tab focused). Matches `.env.example` /
 * `NEXT_PUBLIC_RECONCILE_INTERVAL_MS`.
 */
export function readReconcileIntervalMs(): number {
  const raw = process.env.NEXT_PUBLIC_RECONCILE_INTERVAL_MS;
  if (raw === undefined || raw === "") return 60_000;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 60_000;
}

/**
 * Per-domain `useQuery` defaults (IMPLEMENTATION_PLAN Phase 3 table).
 * Spread into `useQuery({ queryKey, queryFn, ...balanceQueryDefaults })` in hooks.
 */
export const balanceQueryDefaults = {
  staleTime: 5 * SECOND,
  gcTime: 5 * MINUTE,
  refetchOnWindowFocus: true as const,
} as const;

export const batchBalancesQueryDefaults = {
  staleTime: 30 * SECOND,
  gcTime: 10 * MINUTE,
  refetchOnWindowFocus: false as const,
  refetchInterval: readReconcileIntervalMs(),
} as const;

export const requestsByEmployeeQueryDefaults = {
  staleTime: 10 * SECOND,
  gcTime: 10 * MINUTE,
  refetchOnWindowFocus: true as const,
} as const;

export const requestsPendingForManagerQueryDefaults = {
  staleTime: 5 * SECOND,
  gcTime: 10 * MINUTE,
  refetchOnWindowFocus: true as const,
  refetchInterval: 15_000 as const,
} as const;

export const requestByIdQueryDefaults = {
  staleTime: 5 * SECOND,
  gcTime: 5 * MINUTE,
  refetchOnWindowFocus: true as const,
} as const;

const defaultQueryClientOptions: QueryClientConfig["defaultOptions"] = {
  queries: {
    /** Unspecified queries refetch immediately when observed; hooks set their own staleTime. */
    staleTime: 0,
    gcTime: 5 * MINUTE,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  },
};

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: defaultQueryClientOptions,
  });
}
