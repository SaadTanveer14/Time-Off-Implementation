import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { ManagerView } from "@/components/manager/ManagerView";
import { renderWithProviders } from "../utils/render";

describe("ManagerView integration", () => {
  it("loads manager queue from hooks and displays actions", async () => {
    renderWithProviders(<ManagerView />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /approve .*commit/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^deny$/i })).toBeInTheDocument();
    });
  });
});
