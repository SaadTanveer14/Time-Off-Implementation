import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopBar } from "@/components/shared/TopBar";

describe("TopBar", () => {
  it("renders employee nav links", () => {
    render(
      <TopBar
        variant="employee"
        userName="Alex Rivera"
        userInitials="AR"
        userRole="Engineer"
      />,
    );
    expect(screen.getByRole("link", { name: /switch to manager/i })).toHaveAttribute(
      "href",
      "/time-off/manager",
    );
  });

  it("renders manager approvals count", () => {
    render(
      <TopBar
        variant="manager"
        userName="Maya Khan"
        userInitials="MK"
        userRole="Manager"
        pendingCount={3}
      />,
    );
    expect(screen.getByRole("link", { name: /approvals \(3\)/i })).toHaveAttribute(
      "href",
      "/time-off/manager",
    );
  });
});
