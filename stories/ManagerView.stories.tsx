import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ManagerView } from "@/components/manager/ManagerView";
import { MockAuthProvider } from "@/hooks/useAuth";

const meta = {
  title: "Pages/ManagerView",
  component: ManagerView,
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
} satisfies Meta<typeof ManagerView>;

export default meta;
type Story = StoryObj<typeof meta>;

const verify: Story["play"] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getAllByRole("heading").length).toBeGreaterThan(0);
  await expect(canvas.getAllByRole("button").length).toBeGreaterThan(0);
};

export const EmptyQueue: Story = { play: verify };
export const BusyQueue: Story = { play: verify };
export const ComposeWithAnniversary: Story = { play: verify };
