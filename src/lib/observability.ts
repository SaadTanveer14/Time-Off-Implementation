export type EventName =
  | "mutation.settled"
  | "mutation.rolled_back"
  | "drift.detected"
  | "silent_failure.detected"
  | "circuit_breaker.opened"
  | "circuit_breaker.closed"
  | "hcm_contract.violation";

export interface ObservabilityEvent {
  name: EventName;
  ts: number;
  payload: Record<string, unknown>;
}

export type ObservabilitySink = {
  track: (event: ObservabilityEvent) => void;
};

let sink: ObservabilitySink | null = null;

export function setObservabilitySink(nextSink: ObservabilitySink | null): void {
  sink = nextSink;
}

export function emit(event: ObservabilityEvent): void {
  if (process.env.NODE_ENV === "production") {
    if (sink) sink.track(event);
    return;
  }
  console.debug("[obs]", event.name, event.payload);
}
