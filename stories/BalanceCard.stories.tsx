import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";
import { BalanceCard } from "@/components/employee/BalanceCard";
import type { Balance } from "@/lib/types";

const base: Balance = {
  locationId: "ny-hq",
  locationName: "New York HQ",
  days: 12,
  syncedAt: Date.now(),
  state: "loaded-fresh",
  isPrimary: true,
};

const meta = {
  title: "Employee/BalanceCard",
  component: BalanceCard,
  parameters: { msw: { handlers: [] } },
} satisfies Meta<typeof BalanceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const verifyCard: Story["play"] = async ({ canvasElement }) => {
  await expect(within(canvasElement).getByText(/days/i)).toBeInTheDocument();
};

export const Loading: Story = { args: { balance: { ...base, state: "loading" } }, play: verifyCard };
export const LoadedFresh: Story = { args: { balance: { ...base, state: "loaded-fresh" } }, play: verifyCard };
export const LoadedStale: Story = { args: { balance: { ...base, state: "loaded-stale" } }, play: verifyCard };
export const OptimisticPending: Story = { args: { balance: { ...base, state: "optimistic-pending", previousDays: 14 } }, play: verifyCard };
export const OptimisticConfirmed: Story = { args: { balance: { ...base, state: "optimistic-confirmed" } }, play: verifyCard };
export const OptimisticRolledBack: Story = { args: { balance: { ...base, state: "optimistic-rolled-back", previousDays: 10 } }, play: verifyCard };
export const SilentlyWrongCorrected: Story = { args: { balance: { ...base, state: "reconciled", previousDays: 15 } }, play: verifyCard };
export const AnniversaryBonusApplied: Story = { args: { balance: { ...base, state: "anniversary-bonus", days: 13 } }, play: verifyCard };
export const YearStartRefresh: Story = { args: { balance: { ...base, state: "reconciled", days: 20, previousDays: 0 } }, play: verifyCard };
export const Error: Story = { args: { balance: { ...base, state: "error" } }, play: verifyCard };
export const PartialFailure: Story = { args: { balance: { ...base, state: "error", locationName: "Remote" } }, play: verifyCard };
export const ReducedMotion: Story = { args: { balance: { ...base, state: "loaded-fresh" } }, play: verifyCard, parameters: { reducedMotion: true } };
