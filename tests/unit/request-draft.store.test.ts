import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRequestDraftStore } from "@/state/request-draft.store";

describe("request-draft.store", () => {
  beforeEach(() => {
    useRequestDraftStore.getState().reset();
  });

  it("sets and resets fields", () => {
    useRequestDraftStore.getState().setField("locationId", "ny-hq");
    useRequestDraftStore.getState().setField("note", "vacation");
    expect(useRequestDraftStore.getState().locationId).toBe("ny-hq");
    expect(useRequestDraftStore.getState().note).toBe("vacation");

    useRequestDraftStore.getState().reset();
    expect(useRequestDraftStore.getState().locationId).toBeNull();
    expect(useRequestDraftStore.getState().note).toBe("");
  });

  it("sets retainedUntil based on ttl", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    useRequestDraftStore.getState().retain(60_000);
    expect(useRequestDraftStore.getState().retainedUntil).toBe(61_000);
  });
});
