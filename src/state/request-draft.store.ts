import { create } from "zustand";

type RequestDraftFields = {
  locationId: string | null;
  startDate: string | null;
  endDate: string | null;
  note: string;
  retainedUntil?: number;
};

type RequestDraftActions = {
  setField: <K extends keyof RequestDraftFields>(key: K, value: RequestDraftFields[K]) => void;
  reset: () => void;
  retain: (ttlMs: number) => void;
};

export type RequestDraftState = RequestDraftFields & RequestDraftActions;

const initialState: RequestDraftFields = {
  locationId: null,
  startDate: null,
  endDate: null,
  note: "",
};

export const useRequestDraftStore = create<RequestDraftState>((set) => ({
  ...initialState,
  setField: (key, value) => set({ [key]: value } as Pick<RequestDraftFields, typeof key>),
  reset: () => set(initialState),
  retain: (ttlMs) => set({ retainedUntil: Date.now() + Math.max(0, ttlMs) }),
}));
