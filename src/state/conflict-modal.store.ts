import { create } from "zustand";

type ConflictModalState = {
  open: boolean;
  requestId?: string;
  staleBalance?: number;
  liveBalance?: number;
  openModal: (payload: {
    requestId: string;
    staleBalance: number;
    liveBalance: number;
  }) => void;
  closeModal: () => void;
};

export const useConflictModalStore = create<ConflictModalState>((set) => ({
  open: false,
  openModal: ({ requestId, staleBalance, liveBalance }) =>
    set({ open: true, requestId, staleBalance, liveBalance }),
  closeModal: () => set({ open: false, requestId: undefined, staleBalance: undefined, liveBalance: undefined }),
}));
