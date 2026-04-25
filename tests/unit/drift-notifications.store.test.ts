import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDriftNotificationsStore } from "@/state/drift-notifications.store";

describe("drift-notifications.store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useDriftNotificationsStore.getState().clear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("enqueues and dismisses notifications", () => {
    const item = useDriftNotificationsStore.getState().enqueue({
      employeeId: "emp_alex",
      locationId: "ny-hq",
      locationName: "New York HQ",
      delta: 1,
      category: "anniversary_bonus",
    });
    expect(useDriftNotificationsStore.getState().notifications).toHaveLength(1);
    useDriftNotificationsStore.getState().dismiss(item.id);
    expect(useDriftNotificationsStore.getState().notifications).toHaveLength(0);
  });

  it("auto-dismisses anniversary and unknown drift notifications", () => {
    useDriftNotificationsStore.getState().enqueue({
      employeeId: "emp_alex",
      locationId: "ny-hq",
      locationName: "New York HQ",
      delta: 1,
      category: "anniversary_bonus",
    });
    useDriftNotificationsStore.getState().enqueue({
      employeeId: "emp_alex",
      locationId: "ny-hq",
      locationName: "New York HQ",
      delta: -1,
      category: "unknown",
    });

    expect(useDriftNotificationsStore.getState().notifications).toHaveLength(2);
    vi.advanceTimersByTime(6_000);
    expect(useDriftNotificationsStore.getState().notifications).toHaveLength(0);
  });

  it("keeps year_start_reset notification until dismissed", () => {
    const row = useDriftNotificationsStore.getState().enqueue({
      employeeId: "emp_alex",
      locationId: "ny-hq",
      locationName: "New York HQ",
      delta: 5,
      category: "year_start_reset",
    });

    vi.advanceTimersByTime(30_000);
    expect(useDriftNotificationsStore.getState().notifications).toHaveLength(1);
    useDriftNotificationsStore.getState().dismiss(row.id);
    expect(useDriftNotificationsStore.getState().notifications).toHaveLength(0);
  });
});
