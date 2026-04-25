import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { RequestComposer } from "@/components/employee/RequestComposer";
import { renderWithProviders } from "../utils/render";

describe("RequestComposer", () => {
  it("submits when form is valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <RequestComposer
        availableByLocation={{ "ny-hq": 10, remote: 4, sf: 8 }}
        onSubmit={onSubmit}
      />,
    );

    const submit = screen.getByRole("button", { name: /submit request/i });
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      locationId: "ny-hq",
      days: 4,
    });
  });

  it("disables controls while submitting", () => {
    renderWithProviders(
      <RequestComposer
        availableByLocation={{ "ny-hq": 10, remote: 4, sf: 8 }}
        onSubmit={vi.fn()}
        submitting
      />,
    );

    expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("blocks submit when date range overlaps an existing request", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <RequestComposer
        availableByLocation={{ "ny-hq": 10, remote: 4, sf: 8 }}
        requests={[
          {
            id: "req_overlap",
            employeeId: "emp_alex",
            employeeName: "Alex Rivera",
            locationId: "ny-hq",
            locationName: "New York HQ",
            startDate: "2026-05-04",
            endDate: "2026-05-06",
            days: 3,
            status: "pending",
            submittedAt: Date.now(),
          },
        ]}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByLabelText(/from/i));
    await user.type(screen.getByLabelText(/from/i), "2026-05-05");
    await user.clear(screen.getByLabelText(/to/i));
    await user.type(screen.getByLabelText(/to/i), "2026-05-08");
    const submit = screen.getByRole("button", { name: /submit request/i });
    expect(submit).toBeDisabled();
    expect(screen.getByText(/already have a request for these dates/i)).toBeInTheDocument();

    await user.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
