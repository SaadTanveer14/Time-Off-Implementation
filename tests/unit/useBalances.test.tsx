import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBalance, useBatchBalances } from "@/hooks/useBalances";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useBalances", () => {
  it("fetches single balance", async () => {
    const { result } = renderHook(() => useBalance("emp_alex", "ny-hq"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.employeeId).toBe("emp_alex");
  });

  it("fetches batch balances", async () => {
    const { result } = renderHook(() => useBatchBalances("emp_alex"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.balances.length).toBeGreaterThan(0);
  });
});
