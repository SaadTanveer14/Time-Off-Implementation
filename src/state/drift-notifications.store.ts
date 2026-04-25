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

const DRIFT_TTL_MS: Record<DriftCategory, number | null> = {
  anniversary_bonus: 5_000,
  unknown: 6_000,
  // Keep policy-refresh banner dismissible by user (GlobalBanner), not auto-hidden.
  year_start_reset: null,
};

function nextId(): string {
  return `drift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useDriftNotificationsStore = create<DriftNotificationsState>((set, get) => ({
  notifications: [],
  enqueue: (item) => {
    const row: DriftNotification = { id: nextId(), createdAt: Date.now(), ...item };
    set({ notifications: [...get().notifications, row] });
    const ttl = DRIFT_TTL_MS[row.category];
    if (ttl !== null) {
      setTimeout(() => {
        get().dismiss(row.id);
      }, ttl);
    }
    return row;
  },
  dismiss: (id) => set({ notifications: get().notifications.filter((n) => n.id !== id) }),
  clear: () => set({ notifications: [] }),
}));
