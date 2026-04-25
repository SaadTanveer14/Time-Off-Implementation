import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { EmployeeView } from "@/components/employee/EmployeeView";
import { renderWithProviders } from "../utils/render";

describe("EmployeeView integration", () => {
  it("loads employee dashboard from hooks and MSW", async () => {
    renderWithProviders(<EmployeeView />);

    expect(
      screen.getByRole("heading", { name: /your time off, at a glance/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /history/i })).toBeInTheDocument();
    });
  });
});
