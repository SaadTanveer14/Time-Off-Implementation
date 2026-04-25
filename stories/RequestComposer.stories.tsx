import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, fireEvent, fn } from "@storybook/test";
import { RequestComposer } from "@/components/employee/RequestComposer";

const meta = {
  title: "Employee/RequestComposer",
  component: RequestComposer,
  args: {
    availableByLocation: { "ny-hq": 12, remote: 3, sf: 8 },
    onSubmit: fn(),
  },
  parameters: { msw: { handlers: [] } },
} satisfies Meta<typeof RequestComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

const verifyBaseComposer = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await expect(canvas.getAllByRole("button").length).toBeGreaterThan(0);
  await expect(canvas.getByRole("textbox")).toBeInTheDocument();
};

export const EmptyDraft: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await verifyBaseComposer(canvasElement);
    fireEvent.change(canvas.getByLabelText(/from/i), { target: { value: "2026-05-08" } });
    fireEvent.change(canvas.getByLabelText(/to/i), { target: { value: "2026-05-07" } });
    await expect(canvas.getByText(/pick a date range/i)).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /submit request/i })).toBeDisabled();
  },
};

export const PartiallyFilled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await verifyBaseComposer(canvasElement);
    fireEvent.change(canvas.getByLabelText(/from/i), { target: { value: "2026-05-06" } });
    fireEvent.change(canvas.getByLabelText(/to/i), { target: { value: "2026-05-08" } });
    await expect(canvas.getByText(/balance is sufficient/i)).toBeInTheDocument();
  },
};

export const ValidSubmittable: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await verifyBaseComposer(canvasElement);
    await expect(canvas.getByText(/balance is sufficient/i)).toBeInTheDocument();
    const submitButton = canvas.getByRole("button", { name: /submit request/i });
    await expect(submitButton).toBeEnabled();
    fireEvent.click(submitButton);
    await expect(args.onSubmit).toHaveBeenCalled();
  },
};
export const InvalidInsufficientBalance: Story = {
  args: { availableByLocation: { "ny-hq": 1, remote: 1, sf: 1 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await verifyBaseComposer(canvasElement);
    await expect(canvas.getByText(/short by/i)).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /submit request/i })).toBeDisabled();
  },
};
export const InvalidDateRange: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await verifyBaseComposer(canvasElement);
    fireEvent.change(canvas.getByLabelText(/from/i), { target: { value: "2026-05-12" } });
    fireEvent.change(canvas.getByLabelText(/to/i), { target: { value: "2026-05-10" } });
    await expect(canvas.getByText(/pick a date range/i)).toBeInTheDocument();
  },
};
export const Submitting: Story = {
  args: { submitting: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await verifyBaseComposer(canvasElement);
    await expect(canvas.getByRole("button", { name: /submitting/i })).toBeDisabled();
  },
};
export const SubmittedSuccess: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await verifyBaseComposer(canvasElement);
    fireEvent.click(canvas.getByRole("button", { name: /submit request/i }));
    await expect(args.onSubmit).toHaveBeenCalled();
    await expect(canvas.getByText(/balance is sufficient/i)).toBeInTheDocument();
  },
};
export const SubmittedRejected: Story = {
  args: { availableByLocation: { "ny-hq": 0, remote: 0, sf: 0 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await verifyBaseComposer(canvasElement);
    await expect(canvas.getByText(/short by/i)).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /submit request/i })).toBeDisabled();
  },
};
export const NetworkFailure: Story = {
  args: { requests: [{ id: "req-1", employeeId: "emp_alex", employeeName: "Alex", locationId: "ny-hq", locationName: "NY HQ", startDate: "2026-05-05", endDate: "2026-05-07", days: 3, status: "pending", submittedAt: Date.now() }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await verifyBaseComposer(canvasElement);
    await expect(canvas.getByText(/you already have a request for these dates/i)).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /submit request/i })).toBeDisabled();
  },
};
export const CircuitBreakerOpen: Story = {
  args: { availableByLocation: { "ny-hq": 0, remote: 3, sf: 0 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await verifyBaseComposer(canvasElement);
    fireEvent.click(canvas.getByRole("button", { name: /^remote\s+\d+\s+avail\.$/i }));
    fireEvent.change(canvas.getByLabelText(/from/i), { target: { value: "2026-05-05" } });
    fireEvent.change(canvas.getByLabelText(/to/i), { target: { value: "2026-05-07" } });
    await expect(canvas.getByText(/balance is sufficient/i)).toBeInTheDocument();
  },
};
