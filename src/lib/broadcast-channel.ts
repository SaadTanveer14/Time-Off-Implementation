type MessageHandler<T> = (data: T) => void;

export type BroadcastLike<T> = {
  postMessage: (message: T) => void;
  close: () => void;
  addEventListener: (type: "message", listener: (event: MessageEvent<T>) => void) => void;
  removeEventListener: (type: "message", listener: (event: MessageEvent<T>) => void) => void;
};

export type BroadcastChannelCtor = new (name: string) => BroadcastLike<unknown>;

class NoopBroadcastChannel<T> implements BroadcastLike<T> {
  postMessage(_: T): void {}
  close(): void {}
  addEventListener(_: "message", __: (event: MessageEvent<T>) => void): void {}
  removeEventListener(_: "message", __: (event: MessageEvent<T>) => void): void {}
}

function resolveCtor(ctor?: BroadcastChannelCtor): BroadcastChannelCtor | null {
  if (ctor) return ctor;
  if (typeof globalThis !== "undefined" && "BroadcastChannel" in globalThis) {
    return globalThis.BroadcastChannel as unknown as BroadcastChannelCtor;
  }
  return null;
}

export function createBroadcastChannel<T>(
  name: string,
  ctor?: BroadcastChannelCtor,
): BroadcastLike<T> {
  const resolved = resolveCtor(ctor);
  if (!resolved) return new NoopBroadcastChannel<T>();
  return new resolved(name) as BroadcastLike<T>;
}

export function subscribe<T>(
  channel: BroadcastLike<T>,
  handler: MessageHandler<T>,
): () => void {
  const listener = (event: MessageEvent<T>) => handler(event.data);
  channel.addEventListener("message", listener);
  return () => channel.removeEventListener("message", listener);
}
