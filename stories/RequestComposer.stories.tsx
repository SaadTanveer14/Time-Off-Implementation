import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";
import { RequestComposer } from "@/components/employee/RequestComposer";

const meta = {
  title: "Employee/RequestComposer",
  component: RequestComposer,
  args: {
    availableByLocation: { "ny-hq": 12, remote: 3, sf: 8 },
    onSubmit: () => {},
  },
  parameters: { msw: { handlers: [] } },
} satisfies Meta<typeof RequestComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

const verifyComposer: Story["play"] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getAllByRole("button").length).toBeGreaterThan(0);
  await expect(canvas.getByRole("textbox")).toBeInTheDocument();
};

export const EmptyDraft: Story = { play: verifyComposer };
export const PartiallyFilled: Story = { play: verifyComposer };
export const ValidSubmittable: Story = { play: verifyComposer };
export const InvalidInsufficientBalance: Story = {
  args: { availableByLocation: { "ny-hq": 1, remote: 1, sf: 1 } },
  play: verifyComposer,
};
export const InvalidDateRange: Story = { play: verifyComposer };
export const Submitting: Story = { args: { submitting: true }, play: verifyComposer };
export const SubmittedSuccess: Story = { play: verifyComposer };
export const SubmittedRejected: Story = { play: verifyComposer };
export const NetworkFailure: Story = { play: verifyComposer };
export const CircuitBreakerOpen: Story = { play: verifyComposer };
