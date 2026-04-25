import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToastQueueStore } from "@/state/toast-queue.store";

describe("toast-queue.store", () => {
  beforeEach(() => {
    useToastQueueStore.getState().clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("auto-dismisses success/info/warning by configured TTL", () => {
    const success = useToastQueueStore.getState().enqueue({ kind: "success", title: "ok" });
    const info = useToastQueueStore.getState().enqueue({ kind: "info", title: "info" });
    const warning = useToastQueueStore.getState().enqueue({ kind: "warning", title: "warn" });
    expect(useToastQueueStore.getState().toasts.map((t) => t.id)).toEqual([success.id, info.id, warning.id]);

    vi.advanceTimersByTime(4_000);
    expect(useToastQueueStore.getState().toasts.find((t) => t.id === success.id)).toBeUndefined();
    expect(useToastQueueStore.getState().toasts.find((t) => t.id === info.id)).toBeTruthy();
    expect(useToastQueueStore.getState().toasts.find((t) => t.id === warning.id)).toBeTruthy();

    vi.advanceTimersByTime(1_000);
    expect(useToastQueueStore.getState().toasts.find((t) => t.id === info.id)).toBeUndefined();
    expect(useToastQueueStore.getState().toasts.find((t) => t.id === warning.id)).toBeTruthy();

    vi.advanceTimersByTime(1_000);
    expect(useToastQueueStore.getState().toasts.find((t) => t.id === warning.id)).toBeUndefined();
  });

  it("keeps error toast sticky until dismissed", () => {
    const error = useToastQueueStore.getState().enqueue({ kind: "error", title: "err" });
    vi.advanceTimersByTime(30_000);
    expect(useToastQueueStore.getState().toasts.find((t) => t.id === error.id)).toBeTruthy();
    useToastQueueStore.getState().dismiss(error.id);
    expect(useToastQueueStore.getState().toasts).toHaveLength(0);
  });
});
