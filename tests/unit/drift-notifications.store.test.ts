import { beforeEach, describe, expect, it } from "vitest";
import { useDriftNotificationsStore } from "@/state/drift-notifications.store";

describe("drift-notifications.store", () => {
  beforeEach(() => {
    useDriftNotificationsStore.getState().clear();
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
});
