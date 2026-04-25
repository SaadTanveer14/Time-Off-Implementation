import { describe, expect, it } from "vitest";
import { generateIdempotencyKey } from "@/lib/idempotency";

describe("idempotency", () => {
  it("uses provided UUID generator for testability", () => {
    const key = generateIdempotencyKey(() => "test-key-123");
    expect(key).toBe("test-key-123");
  });

  it("returns a non-empty key by default", () => {
    const key = generateIdempotencyKey();
    expect(typeof key).toBe("string");
    expect(key.length).toBeGreaterThan(0);
  });
});
