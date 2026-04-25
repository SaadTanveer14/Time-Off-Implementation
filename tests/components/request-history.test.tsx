import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { RequestHistory } from "@/components/employee/RequestHistory";
import { renderWithProviders } from "../utils/render";
import type { TimeOffRequest } from "@/lib/types";

const baseRequest: TimeOffRequest = {
  id: "req_1",
  employeeId: "emp_alex",
  employeeName: "Alex Rivera",
  locationId: "ny-hq",
  locationName: "New York HQ",
  startDate: "2026-05-05",
  endDate: "2026-05-08",
  days: 4,
  status: "pending",
  submittedAt: Date.now(),
};

describe("RequestHistory", () => {
  it("shows empty state", () => {
    renderWithProviders(<RequestHistory requests={[]} onCancel={vi.fn()} />);
    expect(screen.getByText(/no requests yet/i)).toBeInTheDocument();
  });

  it("calls onCancel for cancellable request", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderWithProviders(<RequestHistory requests={[baseRequest]} onCancel={onCancel} />);

    await user.hover(screen.getByText(/may/i));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledWith("req_1");
  });
});
