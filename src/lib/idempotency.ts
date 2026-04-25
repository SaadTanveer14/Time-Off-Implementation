export type RandomUuidFn = () => string;

function fallbackUuid(): string {
  const part = () => Math.random().toString(16).slice(2, 10).padEnd(8, "0");
  return `${part()}-${part().slice(0, 4)}-4${part().slice(0, 3)}-a${part().slice(0, 3)}-${part()}${part()}`;
}

function defaultUuidFn(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return fallbackUuid();
}

export function generateIdempotencyKey(randomUuid: RandomUuidFn = defaultUuidFn): string {
  return randomUuid();
}
