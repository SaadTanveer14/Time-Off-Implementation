export type RequestState =
  | "draft"
  | "pending-submit"
  | "pending-approval"
  | "approved"
  | "denied"
  | "cancelled";

export type RequestEvent = "submit" | "success" | "error" | "approve" | "deny" | "cancel";

export type TransitionSuccess = {
  ok: true;
  from: RequestState;
  event: RequestEvent;
  to: RequestState;
};

export type TransitionFailure = {
  ok: false;
  from: RequestState;
  event: RequestEvent;
  reason: "illegal_transition";
};

export type TransitionResult = TransitionSuccess | TransitionFailure;

const table: Record<RequestState, Partial<Record<RequestEvent, RequestState>>> = {
  draft: { submit: "pending-submit" },
  "pending-submit": { success: "pending-approval", error: "draft" },
  "pending-approval": { approve: "approved", deny: "denied", cancel: "cancelled" },
  approved: {},
  denied: {},
  cancelled: {},
};

function isDevMode(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function transition(from: RequestState, event: RequestEvent): TransitionResult {
  const to = table[from][event];
  if (!to) {
    if (isDevMode()) {
      throw new Error(`Illegal request transition: ${from} --(${event})--> __illegal__`);
    }
    return { ok: false, from, event, reason: "illegal_transition" };
  }
  return { ok: true, from, event, to };
}
