import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MockAuthProvider } from "@/hooks/useAuth";
import { AuthGate } from "@/components/shared/AuthGate";
import { authGate as copy } from "@/copy";

describe("AuthGate", () => {
  it("renders children when auth ids are present", () => {
    render(
      <MockAuthProvider>
        <AuthGate>
          <div>inside</div>
        </AuthGate>
      </MockAuthProvider>,
    );
    expect(screen.getByText("inside")).toBeInTheDocument();
  });

  it("blocks when employee id is missing", () => {
    render(
      <MockAuthProvider value={{ employeeId: "" }}>
        <AuthGate>
          <div>inside</div>
        </AuthGate>
      </MockAuthProvider>,
    );
    expect(screen.queryByText("inside")).not.toBeInTheDocument();
    expect(screen.getByText(copy.invalidTitle)).toBeInTheDocument();
  });
});
