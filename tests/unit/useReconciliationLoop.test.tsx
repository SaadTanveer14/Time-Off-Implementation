import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReconciliationLoop } from "@/hooks/useReconciliationLoop";
import { qk } from "@/lib/query-keys";
import { useDriftNotificationsStore } from "@/state/drift-notifications.store";

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useReconciliationLoop", () => {
  it("loads batch balances and enqueues drift notifications via store", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    useDriftNotificationsStore.getState().clear();
    client.setQueryData(qk.balance("emp_alex", "ny-hq"), {
      employeeId: "emp_alex",
      locationId: "ny-hq",
      locationName: "New York HQ",
      available: 1,
      updatedAt: new Date().toISOString(),
    });
    const { result } = renderHook(() => useReconciliationLoop("emp_alex"), { wrapper: createWrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.employeeId).toBe("emp_alex");
    expect(useDriftNotificationsStore.getState().notifications.length).toBeGreaterThan(0);
  });
});
