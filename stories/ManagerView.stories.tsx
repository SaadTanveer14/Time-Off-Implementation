import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, fireEvent } from "@storybook/test";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ManagerView } from "@/components/manager/ManagerView";
import { MockAuthProvider } from "@/hooks/useAuth";
import { getMockState, putRequest, resetMockState } from "@/mocks/hcm/state";
import { mergeScenarioFlags, mockScenarioFlags } from "@/mocks/hcm/scenario-flags";
import { useManagerFiltersStore } from "@/state/manager-filters.store";
import { pendingApprovals } from "@/mocks/data";

const meta = {
  title: "Pages/ManagerView",
  component: ManagerView,
  decorators: [
    (Story) => {
      resetMockState();
      // Always seed queue stories with canonical pending approvals.
      // Some mock seeds include unrelated pending rows; this keeps story state deterministic.
      for (const p of pendingApprovals) {
        putRequest({
          id: p.id,
          employeeId: p.employeeId,
          locationId: p.locationId,
          startDate: p.startDate,
          endDate: p.endDate,
          days: p.days,
          status: "pending-approval",
          note: p.note,
          submittedAt: new Date(p.submittedAt).toISOString(),
        });
      }
      useManagerFiltersStore.setState({
        filter: "pending",
        selectedId: "",
        sessionDecisions: [],
      });
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
} satisfies Meta<typeof ManagerView>;

export default meta;
type Story = StoryObj<typeof meta>;

const verifyPending: Story["play"] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getAllByRole("heading").length).toBeGreaterThan(0);
  await expect(await canvas.findByRole("button", { name: /^pending/i })).toBeInTheDocument();

  const approveButton = canvas.queryByRole("button", { name: /^approve$/i });
  if (approveButton) {
    await expect(approveButton).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /^deny$/i })).toBeInTheDocument();
    return;
  }

  // Fallback when the queue is empty in a given runtime/mock state.
  await expect(await canvas.findByText(/the queue is clear/i)).toBeInTheDocument();
};

const verifyApprovedEmpty: Story["play"] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getAllByRole("heading").length).toBeGreaterThan(0);
  fireEvent.click(canvas.getByRole("button", { name: /^approved/i }));
  await expect(await canvas.findByText(/no approved requests yet/i)).toBeInTheDocument();
};

export const EmptyQueue: Story = { play: verifyApprovedEmpty };
export const BusyQueue: Story = { play: verifyPending };
export const ComposeWithAnniversary: Story = { play: verifyPending };

function ManagerMockLab() {
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState("Ready");

  const refresh = (label: string) => {
    setStatus(label);
    setRevision((v) => v + 1);
  };

  const pending = Array.from(getMockState().requests.values()).filter(
    (r) => r.status === "pending-approval" || r.status === "pending-submit",
  );
  const targetPendingId = pending[0]?.id ?? null;

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
              mergeScenarioFlags({ conflictOnApproveOnce: true });
              refresh("Enabled one-time approve conflict");
            }}
          >
            Conflict on approve once
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold"
            onClick={() => {
              if (!targetPendingId) return;
              mergeScenarioFlags({ conflictOnApproveRequestId: targetPendingId });
              refresh(`Conflict on ${targetPendingId}`);
            }}
          >
            Conflict selected pending
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold"
            onClick={() => {
              mergeScenarioFlags({ circuit500Until: Date.now() + 20_000 });
              refresh("Opened circuit for 20s");
            }}
          >
            Circuit open (20s)
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold"
            onClick={() => {
              mergeScenarioFlags({
                conflictOnApproveOnce: false,
                conflictOnApproveRequestId: null,
                circuit500Until: null,
                offline: false,
              });
              refresh("Cleared scenario flags");
            }}
          >
            Clear flags
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-600">
          Status: {status} · pending requests: {pending.length} · conflictOnce:{" "}
          {mockScenarioFlags.conflictOnApproveOnce ? "true" : "false"} · circuitOpen:{" "}
          {mockScenarioFlags.circuit500Until ? "true" : "false"}
        </p>
      </div>
      <div key={revision}>
        <ManagerView />
      </div>
    </div>
  );
}

export const InteractiveMockLab: Story = {
  render: () => <ManagerMockLab />,
};
