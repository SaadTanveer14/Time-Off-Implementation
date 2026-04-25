import { create } from "zustand";

export type ToastKind = "success" | "info" | "warning" | "error";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
  createdAt: number;
};

const TOAST_TTL_MS: Record<ToastKind, number | null> = {
  success: 4_000,
  info: 5_000,
  warning: 6_000,
  error: null,
};

type ToastQueueState = {
  toasts: ToastItem[];
  enqueue: (toast: Omit<ToastItem, "id" | "createdAt">) => ToastItem;
  dismiss: (id: string) => void;
  clear: () => void;
};

function nextId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useToastQueueStore = create<ToastQueueState>((set, get) => ({
  toasts: [],
  enqueue: (toast) => {
    const item: ToastItem = {
      id: nextId(),
      createdAt: Date.now(),
      ...toast,
    };
    set({ toasts: [...get().toasts, item] });
    const ttl = TOAST_TTL_MS[item.kind];
    if (ttl !== null) {
      setTimeout(() => {
        get().dismiss(item.id);
      }, ttl);
    }
    return item;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  clear: () => set({ toasts: [] }),
}));
