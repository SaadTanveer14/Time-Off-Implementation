import { describe, expect, it, vi } from "vitest";
import { createBroadcastChannel, subscribe } from "@/lib/broadcast-channel";

class FakeChannel<T> {
  private listeners = new Set<(event: MessageEvent<T>) => void>();
  postMessage(message: T): void {
    const evt = { data: message } as MessageEvent<T>;
    for (const l of this.listeners) l(evt);
  }
  addEventListener(_type: "message", listener: (event: MessageEvent<T>) => void): void {
    this.listeners.add(listener);
  }
  removeEventListener(_type: "message", listener: (event: MessageEvent<T>) => void): void {
    this.listeners.delete(listener);
  }
  close(): void {}
}

describe("broadcast-channel wrapper", () => {
  it("subscribes and unsubscribes handler", () => {
    const channel = createBroadcastChannel<{ type: string }>(
      "x",
      FakeChannel as unknown as new (name: string) => FakeChannel<unknown>,
    );
    const handler = vi.fn();
    const off = subscribe(channel, handler);
    channel.postMessage({ type: "event" });
    expect(handler).toHaveBeenCalledWith({ type: "event" });

    off();
    channel.postMessage({ type: "event2" });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
