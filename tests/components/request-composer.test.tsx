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
});
