import { create } from "zustand";
import type { PendingApproval } from "@/lib/types";

export type ManagerFilter = "pending" | "approved" | "denied";

export type ManagerSessionDecision = {
  req: PendingApproval;
  outcome: "approved" | "denied";
};

type ManagerFiltersState = {
  filter: ManagerFilter;
  selectedId: string;
  sessionDecisions: ManagerSessionDecision[];
  setFilter: (filter: ManagerFilter) => void;
  setSelected: (selectedId: string) => void;
  pushSessionDecision: (row: ManagerSessionDecision) => void;
  resetSessionDecisions: () => void;
};

export const useManagerFiltersStore = create<ManagerFiltersState>((set, get) => ({
  filter: "pending",
  selectedId: "",
  sessionDecisions: [],
  setFilter: (filter) => set({ filter }),
  setSelected: (selectedId) => set({ selectedId }),
  pushSessionDecision: (row) => set({ sessionDecisions: [row, ...get().sessionDecisions] }),
  resetSessionDecisions: () => set({ sessionDecisions: [] }),
}));
