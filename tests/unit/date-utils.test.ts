import { afterEach, describe, expect, it, vi } from "vitest";
import { businessDays, cn, formatDateRange, newId, relativeTime } from "@/lib/utils";

describe("date-utils", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("formats same-day ranges as one date", () => {
    expect(formatDateRange("2026-05-05", "2026-05-05")).toContain("May");
  });

  it("formats multi-day ranges with arrow", () => {
    expect(formatDateRange("2026-04-17", "2026-04-20")).toContain("→");
  });

  it("counts business days inclusively", () => {
    expect(businessDays("2026-05-04", "2026-05-08")).toBe(5);
  });

  it("returns zero when end is before start", () => {
    expect(businessDays("2026-05-08", "2026-05-04")).toBe(0);
  });

  it("formats relative time across boundaries", () => {
    const now = 1_000_000;
    expect(relativeTime(now - 2_000, now)).toBe("just now");
    expect(relativeTime(now - 20_000, now)).toBe("20s ago");
    expect(relativeTime(now - 2 * 60_000, now)).toBe("2 min ago");
    expect(relativeTime(now - 2 * 60 * 60_000, now)).toBe("2h ago");
    expect(relativeTime(now - 2 * 24 * 60 * 60_000, now)).toBe("2d ago");
  });

  it("merges class names through cn", () => {
    expect(cn("px-2", undefined, "px-4", "text-sm")).toContain("px-4");
  });

  it("uses crypto.randomUUID branch in newId when available", () => {
    vi.stubGlobal("crypto", {
      randomUUID: () => "12345678-1234-4000-a000-123456789abc",
    });
    expect(newId("req")).toBe("req_12345678");
  });

  it("uses fallback random branch in newId when crypto is absent", () => {
    vi.stubGlobal("crypto", undefined);
    const id = newId("req");
    expect(id.startsWith("req_")).toBe(true);
  });
});
