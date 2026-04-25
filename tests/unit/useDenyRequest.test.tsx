import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDenyRequest } from "@/hooks/useDenyRequest";

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useDenyRequest", () => {
  it("denies request", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
    const { result } = renderHook(() => useDenyRequest(), { wrapper: createWrapper(client) });
    result.current.mutate({
      managerId: "mgr_maya",
      requestId: "req_p002",
      reason: "capacity constraints",
      employeeId: "emp_jordan",
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
