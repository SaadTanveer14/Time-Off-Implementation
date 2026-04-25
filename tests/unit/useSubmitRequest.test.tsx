import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSubmitRequest } from "@/hooks/useSubmitRequest";
import { useRequestDraftStore } from "@/state/request-draft.store";
import { useToastQueueStore } from "@/state/toast-queue.store";

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useSubmitRequest", () => {
  beforeEach(() => {
    useRequestDraftStore.getState().reset();
    useToastQueueStore.getState().clear();
  });

  it("submits and settles request mutation and emits success toast", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
    const { result } = renderHook(() => useSubmitRequest("emp_alex"), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      employeeId: "emp_alex",
      locationId: "ny-hq",
      startDate: "2026-11-01",
      endDate: "2026-11-02",
      days: 2,
      note: "test",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useToastQueueStore.getState().toasts.some((t) => t.kind === "success")).toBe(true);
  });

  it("retains draft and emits error toast on rejection", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
    const { result } = renderHook(() => useSubmitRequest("emp_alex"), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      employeeId: "emp_alex",
      locationId: "ny-hq",
      startDate: "2026-11-01",
      endDate: "2026-11-30",
      days: 999,
      note: "too many",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useRequestDraftStore.getState().retainedUntil).toBeTypeOf("number");
    expect(useToastQueueStore.getState().toasts.some((t) => t.kind === "error")).toBe(true);
  });
});
