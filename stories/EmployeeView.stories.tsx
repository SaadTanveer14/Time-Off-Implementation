import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, fireEvent } from "@storybook/test";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmployeeView } from "@/components/employee/EmployeeView";
import { MockAuthProvider } from "@/hooks/useAuth";
import { applyAnniversaryBonus, getMockState, resetMockState, yearStartResetAll } from "@/mocks/hcm/state";
import { mergeScenarioFlags, mockScenarioFlags } from "@/mocks/hcm/scenario-flags";

const meta = {
  title: "Pages/EmployeeView",
  component: EmployeeView,
  decorators: [
    (Story) => {
      resetMockState();
      return (
        <QueryClientProvider client={new QueryClient()}>
          <MockAuthProvider>
            <Story />
          </MockAuthProvider>
        </QueryClientProvider>
      );
    },
  ],
  parameters: { msw: { handlers: [] } },
} satisfies Meta<typeof EmployeeView>;

export default meta;
type Story = StoryObj<typeof meta>;

const verify: Story["play"] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getAllByRole("heading").length).toBeGreaterThan(0);
  const locationButtons = await canvas.findAllByRole("button", {
    // Accept decimal balances too (e.g. "Remote 0.5 avail.")
    name: /^\w[\w\s-]*\s+\d+(?:\.\d+)?\s+avail\.$/i,
  });
  fireEvent.click(locationButtons[0]!);
  await expect(
    (
      await canvas.findAllByText(
        /balance is sufficient|short by|you already have a request/i,
      )
    ).length,
  ).toBeGreaterThan(0);
};

export const FirstVisit: Story = { play: verify };
export const MixedHistory: Story = { play: verify };

function EmployeeMockLab() {
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState("Ready");

  const refresh = (label: string) => {
    setStatus(label);
    setRevision((v) => v + 1);
  };

  const pendingCount = Array.from(getMockState().requests.values()).filter(
    (r) => r.status === "pending-approval" || r.status === "pending-submit",
  ).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Mock Controls</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold"
            onClick={() => {
              resetMockState();
              refresh("Reset state");
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold"
            onClick={() => {
              applyAnniversaryBonus("emp_alex");
              refresh("Applied anniversary bonus");
            }}
          >
            Anniversary bonus now
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold"
            onClick={() => {
              yearStartResetAll();
              refresh("Applied year-start reset");
            }}
          >
            Year-start reset
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold"
            onClick={() => {
              mergeScenarioFlags({ offline: true });
              refresh("Set offline=true");
            }}
          >
            Go offline
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold"
            onClick={() => {
              mergeScenarioFlags({ offline: false, circuit500Until: null });
              refresh("Recovered network");
            }}
          >
            Recover network
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-600">
          Status: {status} · pending requests: {pendingCount} · offline:{" "}
          {mockScenarioFlags.offline ? "true" : "false"}
        </p>
      </div>
      <div key={revision}>
        <EmployeeView />
      </div>
    </div>
  );
}

export const InteractiveMockLab: Story = {
  render: () => <EmployeeMockLab />,
};
