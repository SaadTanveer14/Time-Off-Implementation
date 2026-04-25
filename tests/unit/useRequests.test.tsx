import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePendingRequests, useRequest, useRequests } from "@/hooks/useRequests";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useRequests hooks", () => {
  it("fetches employee requests", async () => {
    const { result } = renderHook(() => useRequests("emp_alex"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
  });

  it("fetches manager pending requests", async () => {
    const { result } = renderHook(() => usePendingRequests("mgr_maya"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
  });

  it("fetches request by id", async () => {
    const { result } = renderHook(() => useRequest("req_001"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("req_001");
  });
});
