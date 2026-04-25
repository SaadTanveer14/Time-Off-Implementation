import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConflictError, useApproveRequest } from "@/hooks/useApproveRequest";
import { useConflictModalStore } from "@/state/conflict-modal.store";

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useApproveRequest", () => {
  beforeEach(() => {
    useConflictModalStore.getState().closeModal();
  });

  it("approves when stale balance equals live", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
    const { result } = renderHook(() => useApproveRequest(), { wrapper: createWrapper(client) });
    result.current.mutate({
      managerId: "mgr_maya",
      requestId: "req_p001",
      employeeId: "emp_alex",
      locationId: "ny-hq",
      requestedDays: 3,
      staleBalance: 10,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("raises conflict error when stale balance mismatches live", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
    const { result } = renderHook(() => useApproveRequest(), { wrapper: createWrapper(client) });
    result.current.mutate({
      managerId: "mgr_maya",
      requestId: "req_p001",
      employeeId: "emp_alex",
      locationId: "ny-hq",
      requestedDays: 3,
      staleBalance: 999,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ConflictError);
    expect(useConflictModalStore.getState().open).toBe(true);
    expect(useConflictModalStore.getState().requestId).toBe("req_p001");
  });
});
