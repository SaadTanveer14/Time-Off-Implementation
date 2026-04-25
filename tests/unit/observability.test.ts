import { describe, expect, it, vi } from "vitest";
import { emit, setObservabilitySink, type ObservabilityEvent } from "@/lib/observability";

describe("observability", () => {
  it("logs to console.debug in non-production", () => {
    vi.stubEnv("NODE_ENV", "development");
    const spy = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const evt: ObservabilityEvent = {
      name: "mutation.settled",
      ts: Date.now(),
      payload: { type: "submit" },
    };
    emit(evt);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("sends to sink in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const track = vi.fn();
    setObservabilitySink({ track });
    const evt: ObservabilityEvent = {
      name: "drift.detected",
      ts: Date.now(),
      payload: { locationId: "ny-hq" },
    };
    emit(evt);
    expect(track).toHaveBeenCalledWith(evt);
    setObservabilitySink(null);
  });
});
