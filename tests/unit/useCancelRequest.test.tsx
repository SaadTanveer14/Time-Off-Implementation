import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCancelRequest } from "@/hooks/useCancelRequest";
import { useToastQueueStore } from "@/state/toast-queue.store";
import { qk } from "@/lib/query-keys";

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useCancelRequest", () => {
  beforeEach(() => {
    useToastQueueStore.getState().clear();
  });

  it("cancels a pending request", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
    const { result } = renderHook(() => useCancelRequest(), { wrapper: createWrapper(client) });

    result.current.mutate({ employeeId: "emp_alex", requestId: "req_001" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useToastQueueStore.getState().toasts.some((t) => t.kind === "warning")).toBe(true);
  });

  it("handles cancel error and still emits warning toast", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
    client.setQueryData(qk.requestsByEmployee("emp_alex"), [
      {
        id: "req_001",
        employeeId: "emp_alex",
        locationId: "ny-hq",
        startDate: "2026-05-05",
        endDate: "2026-05-06",
        days: 1,
        status: "pending-approval",
        submittedAt: "2026-04-20T12:00:00.000Z",
      },
    ]);
    const { result } = renderHook(() => useCancelRequest(), { wrapper: createWrapper(client) });

    // Unknown request id forces API error and onError path.
    result.current.mutate({ employeeId: "emp_alex", requestId: "missing_request" });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useToastQueueStore.getState().toasts.some((t) => t.kind === "warning")).toBe(true);
  });
});
