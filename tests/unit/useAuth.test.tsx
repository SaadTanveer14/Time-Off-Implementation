import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { MockAuthProvider, useAuth } from "@/hooks/useAuth";

describe("useAuth", () => {
  it("returns default auth values from mock provider", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <MockAuthProvider>{children}</MockAuthProvider>,
    });
    expect(result.current.employeeId).toBe("emp_alex");
    expect(result.current.managerId).toBe("mgr_maya");
    expect(result.current.roles).toContain("employee");
  });

  it("accepts provider overrides", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <MockAuthProvider value={{ employeeId: "emp_x", managerId: "mgr_y", roles: ["employee"] }}>
          {children}
        </MockAuthProvider>
      ),
    });
    expect(result.current.employeeId).toBe("emp_x");
    expect(result.current.managerId).toBe("mgr_y");
    expect(result.current.roles).toEqual(["employee"]);
  });
});
