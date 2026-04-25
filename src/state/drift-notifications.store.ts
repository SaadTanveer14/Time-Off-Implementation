import { create } from "zustand";
import type { DriftCategory } from "@/lib/reconciliation";

export type DriftNotification = {
  id: string;
  employeeId: string;
  locationId: string;
  locationName: string;
  delta: number;
  category: DriftCategory;
  createdAt: number;
};

type DriftNotificationsState = {
  notifications: DriftNotification[];
  enqueue: (item: Omit<DriftNotification, "id" | "createdAt">) => DriftNotification;
  dismiss: (id: string) => void;
  clear: () => void;
};

function nextId(): string {
  return `drift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useDriftNotificationsStore = create<DriftNotificationsState>((set, get) => ({
  notifications: [],
  enqueue: (item) => {
    const row: DriftNotification = { id: nextId(), createdAt: Date.now(), ...item };
    set({ notifications: [...get().notifications, row] });
    return row;
  },
  dismiss: (id) => set({ notifications: get().notifications.filter((n) => n.id !== id) }),
  clear: () => set({ notifications: [] }),
}));
