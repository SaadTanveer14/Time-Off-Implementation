import { describe, expect, it, vi } from "vitest";
import { transition, type RequestEvent, type RequestState } from "@/lib/request-state-machine";

describe("request-state-machine", () => {
  it("supports all legal transitions", () => {
    expect(transition("draft", "submit")).toMatchObject({ ok: true, to: "pending-submit" });
    expect(transition("pending-submit", "success")).toMatchObject({ ok: true, to: "pending-approval" });
    expect(transition("pending-submit", "error")).toMatchObject({ ok: true, to: "draft" });
    expect(transition("pending-approval", "approve")).toMatchObject({ ok: true, to: "approved" });
    expect(transition("pending-approval", "deny")).toMatchObject({ ok: true, to: "denied" });
    expect(transition("pending-approval", "cancel")).toMatchObject({ ok: true, to: "cancelled" });
  });

  it("throws on illegal transitions in dev mode", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() => transition("approved", "submit")).toThrow(/Illegal request transition/);
  });

  it("returns typed failure on illegal transitions in production mode", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(transition("approved", "submit")).toEqual({
      ok: false,
      from: "approved",
      event: "submit",
      reason: "illegal_transition",
    });
  });

  it("guards all terminal-state events in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const terminals: RequestState[] = ["approved", "denied", "cancelled"];
    const events: RequestEvent[] = ["submit", "success", "error", "approve", "deny", "cancel"];
    for (const s of terminals) {
      for (const e of events) {
        expect(transition(s, e).ok).toBe(false);
      }
    }
  });
});
