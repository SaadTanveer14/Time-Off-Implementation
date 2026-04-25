import { beforeEach, describe, expect, it } from "vitest";
import { useConflictModalStore } from "@/state/conflict-modal.store";

describe("conflict-modal.store", () => {
  beforeEach(() => {
    useConflictModalStore.getState().closeModal();
  });

  it("opens and closes with payload", () => {
    useConflictModalStore.getState().openModal({
      requestId: "req_p1",
      staleBalance: 10,
      liveBalance: 6,
    });
    expect(useConflictModalStore.getState().open).toBe(true);
    expect(useConflictModalStore.getState().requestId).toBe("req_p1");

    useConflictModalStore.getState().closeModal();
    expect(useConflictModalStore.getState().open).toBe(false);
    expect(useConflictModalStore.getState().requestId).toBeUndefined();
  });
});
