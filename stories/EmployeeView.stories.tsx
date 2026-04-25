import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmployeeView } from "@/components/employee/EmployeeView";
import { MockAuthProvider } from "@/hooks/useAuth";

const meta = {
  title: "Pages/EmployeeView",
  component: EmployeeView,
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <MockAuthProvider>
          <Story />
        </MockAuthProvider>
      </QueryClientProvider>
    ),
  ],
  parameters: { msw: { handlers: [] } },
} satisfies Meta<typeof EmployeeView>;

export default meta;
type Story = StoryObj<typeof meta>;

const verify: Story["play"] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getAllByRole("heading").length).toBeGreaterThan(0);
  await expect(canvas.getAllByRole("button").length).toBeGreaterThan(0);
};

export const FirstVisit: Story = { play: verify };
export const MixedHistory: Story = { play: verify };
