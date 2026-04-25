import { delay, http, HttpResponse, type JsonBodyType } from "msw";
import { z } from "zod";
import {
  HcmApproveRequestBodySchema,
  HcmBalanceCellSchema,
  HcmBatchBalancesResponseSchema,
  HcmDenyRequestBodySchema,
  HcmPatchBalanceBodySchema,
  HcmRequestSchema,
  HcmSubmitRequestBodySchema,
} from "@/schemas/hcm";
import { getNow, toIso } from "./clock";
import { mockScenarioFlags } from "./scenario-flags";
import {
  applyBalanceDelta,
  applyAnniversaryBonus,
  employeeReportingManager,
  getBalanceCell,
  getMockState,
  getRequestById,
  nextGeneratedRequestId,
  peekIdempotency,
  putRequest,
  storeIdempotency,
  yearStartResetAll,
} from "./state";

const SilentOkSchema = z.object({ status: z.literal("ok") });

const ErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  freshAvailable: z.number().int().optional(),
});

function dateRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

function logVerbose(line: string): void {
  if (!mockScenarioFlags.verbose) return;
  console.debug(`[mock-hcm] ${line}`);
}

function applyScheduledTicks(): void {
  const now = getNow();
  const ticks = mockScenarioFlags.anniversaryTicks;
  const remaining: typeof ticks = [];
  for (const t of ticks) {
    if (t.fireAt <= now) {
      applyAnniversaryBonus(t.employeeId);
      logVerbose(`anniversary tick fired for ${t.employeeId}`);
    } else {
      remaining.push(t);
    }
  }
  mockScenarioFlags.anniversaryTicks = remaining;

  const ys = mockScenarioFlags.yearStartTick;
  if (ys && now >= ys.fireAt) {
    yearStartResetAll();
    mockScenarioFlags.yearStartTick = null;
    logVerbose("year-start reset applied");
  }
}

async function latencyDelay(isBatch: boolean): Promise<void> {
  const f = mockScenarioFlags;
  let ms = 0;
  if (f.latency.kind === "fixed") {
    ms = f.latency.ms;
  } else {
    const { minMs, maxMs } = f.latency;
    ms = minMs + Math.random() * Math.max(0, maxMs - minMs);
  }
  if (isBatch && f.slowBatchExtraMs > 0) {
    ms += f.slowBatchExtraMs;
  }
  if (ms > 0) await delay(Math.ceil(ms));
}

function checkRateLimit(): Response | null {
  const rl = mockScenarioFlags.rateLimit;
  if (!rl) return null;
  const now = getNow();
  let { windowStart, count, windowMs, limit } = rl;
  if (now - windowStart >= windowMs) {
    windowStart = now;
    count = 0;
  }
  count += 1;
  mockScenarioFlags.rateLimit = { windowStart, count, windowMs, limit };
  if (count > limit) {
    return HttpResponse.json(ErrorBodySchema.parse({ code: "RATE_LIMIT", message: "Too many requests" }), {
      status: 429,
    });
  }
  return null;
}

async function preflight(method: string, path: string, isBatch: boolean): Promise<Response | null> {
  applyScheduledTicks();
  await latencyDelay(isBatch);
  logVerbose(`${method} ${path}`);

  if (mockScenarioFlags.offline) {
    return HttpResponse.error();
  }

  const circuitUntil = mockScenarioFlags.circuit500Until;
  if (circuitUntil !== null && getNow() < circuitUntil) {
    return HttpResponse.json({ message: "circuit" }, { status: 500 });
  }

  const maint = mockScenarioFlags.maintenanceUntil;
  if (maint !== null && getNow() < maint) {
    return new HttpResponse(null, {
      status: 503,
      headers: { "Retry-After": "10" },
    });
  }

  return checkRateLimit();
}

function shouldSilentFailMutation(): boolean {
  const f = mockScenarioFlags;
  if (f.silentFailOnce) {
    f.silentFailOnce = false;
    return true;
  }
  if (f.silentFailRate > 0 && Math.random() < f.silentFailRate) {
    return true;
  }
  return false;
}

function jsonOk<T>(schema: z.ZodType<T>, data: T, init?: number | ResponseInit): Response {
  const parsed = schema.parse(data);
  return HttpResponse.json(parsed as JsonBodyType, typeof init === "number" ? { status: init } : init);
}

export const handlers = [
  http.get("*/api/hcm/balances", async ({ request }) => {
    const block = await preflight("GET", "/balances", false);
    if (block) return block;

    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId");
    const locationId = url.searchParams.get("locationId");
    if (!employeeId || !locationId) {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "VALIDATION", message: "Missing query params" }), {
        status: 400,
      });
    }
    const cell = getBalanceCell(employeeId, locationId);
    if (!cell) {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "NOT_FOUND", message: "Balance cell not found" }), {
        status: 404,
      });
    }
    return jsonOk(HcmBalanceCellSchema, cell);
  }),

  http.get("*/api/hcm/balances/all", async ({ request }) => {
    const block = await preflight("GET", "/balances/all", true);
    if (block) return block;

    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId");
    if (!employeeId) {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "VALIDATION", message: "Missing employeeId" }), {
        status: 400,
      });
    }

    const st = getMockState();
    const rows: Array<{
      locationId: string;
      locationName: string;
      available: number;
      accrualRate?: number;
      updatedAt: string;
    }> = [];

    for (const [, cell] of st.balances) {
      if (cell.employeeId !== employeeId) continue;
      const key = `${cell.employeeId}|${cell.locationId}`;
      if (mockScenarioFlags.partialFailCells.has(key)) continue;
      rows.push({
        locationId: cell.locationId,
        locationName: cell.locationName,
        available: cell.available,
        accrualRate: cell.accrualRate,
        updatedAt: cell.updatedAt,
      });
    }

    const body = HcmBatchBalancesResponseSchema.parse({
      employeeId,
      balances: rows,
      corpusVersion: st.corpusVersion,
    });
    return HttpResponse.json(body);
  }),

  http.patch("*/api/hcm/balances", async ({ request }) => {
    const block = await preflight("PATCH", "/balances", false);
    if (block) return block;

    if (shouldSilentFailMutation()) {
      return HttpResponse.json(SilentOkSchema.parse({ status: "ok" }));
    }

    let bodyJson: unknown;
    try {
      bodyJson = await request.json();
    } catch {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "VALIDATION", message: "Invalid JSON" }), {
        status: 400,
      });
    }
    const parsed = HcmPatchBalanceBodySchema.safeParse(bodyJson);
    if (!parsed.success) {
      return HttpResponse.json(
        ErrorBodySchema.parse({ code: "VALIDATION", message: parsed.error.message }),
        { status: 400 },
      );
    }
    const next = applyBalanceDelta(parsed.data.employeeId, parsed.data.locationId, parsed.data.delta);
    if (!next) {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "NOT_FOUND", message: "Balance cell not found" }), {
        status: 404,
      });
    }
    return jsonOk(HcmBalanceCellSchema, next);
  }),

  http.get("*/api/hcm/requests", async ({ request }) => {
    const block = await preflight("GET", "/requests", false);
    if (block) return block;

    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId");
    if (!employeeId) {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "VALIDATION", message: "Missing employeeId" }), {
        status: 400,
      });
    }
    const list = [...getMockState().requests.values()]
      .filter((r) => r.employeeId === employeeId)
      .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))
      .map((r) => HcmRequestSchema.parse(r));
    return HttpResponse.json(z.array(HcmRequestSchema).parse(list));
  }),

  http.post("*/api/hcm/requests", async ({ request }) => {
    const block = await preflight("POST", "/requests", false);
    if (block) return block;

    const idem = request.headers.get("Idempotency-Key") ?? request.headers.get("idempotency-key");
    if (!idem) {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "VALIDATION", message: "Idempotency-Key required" }), {
        status: 400,
      });
    }

    const cached = peekIdempotency(idem);
    if (cached) {
      return HttpResponse.json(HcmRequestSchema.parse(cached.responseBody), { status: 201 });
    }

    let bodyJson: unknown;
    try {
      bodyJson = await request.json();
    } catch {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "VALIDATION", message: "Invalid JSON" }), {
        status: 400,
      });
    }
    const parsed = HcmSubmitRequestBodySchema.safeParse(bodyJson);
    if (!parsed.success) {
      return HttpResponse.json(
        ErrorBodySchema.parse({ code: "VALIDATION", message: parsed.error.message }),
        { status: 400 },
      );
    }
    const b = parsed.data;
    if (b.endDate < b.startDate) {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "VALIDATION", message: "endDate before startDate" }), {
        status: 400,
      });
    }

    const overlapping = [...getMockState().requests.values()].some(
      (r) =>
        r.employeeId === b.employeeId &&
        r.locationId === b.locationId &&
        (r.status === "pending-submit" || r.status === "pending-approval" || r.status === "approved") &&
        dateRangesOverlap(b.startDate, b.endDate, r.startDate, r.endDate),
    );
    if (overlapping) {
      return HttpResponse.json(
        ErrorBodySchema.parse({
          code: "VALIDATION",
          message: "Overlapping date range with an existing request",
        }),
        { status: 409 },
      );
    }

    const ins = mockScenarioFlags.rejectInsufficientAt;
    if (
      ins &&
      ins.employeeId === b.employeeId &&
      ins.locationId === b.locationId &&
      ins.days === b.days
    ) {
      mockScenarioFlags.rejectInsufficientAt = null;
      return HttpResponse.json(
        ErrorBodySchema.parse({ code: "INSUFFICIENT_BALANCE", message: "Not enough balance" }),
        { status: 409 },
      );
    }

    const inv = mockScenarioFlags.rejectInvalidDimensionAt;
    if (inv && inv.employeeId === b.employeeId && inv.locationId === b.locationId) {
      mockScenarioFlags.rejectInvalidDimensionAt = null;
      return HttpResponse.json(
        ErrorBodySchema.parse({ code: "INVALID_DIMENSION", message: "Not entitled to this location" }),
        { status: 409 },
      );
    }

    const cell = getBalanceCell(b.employeeId, b.locationId);
    if (!cell) {
      return HttpResponse.json(
        ErrorBodySchema.parse({ code: "INVALID_DIMENSION", message: "Unknown location for employee" }),
        { status: 409 },
      );
    }
    if (cell.available < b.days) {
      return HttpResponse.json(
        ErrorBodySchema.parse({ code: "INSUFFICIENT_BALANCE", message: "Not enough balance" }),
        { status: 409 },
      );
    }

    if (shouldSilentFailMutation()) {
      return HttpResponse.json(SilentOkSchema.parse({ status: "ok" }));
    }

    const created = HcmRequestSchema.parse({
      id: nextGeneratedRequestId(),
      employeeId: b.employeeId,
      locationId: b.locationId,
      startDate: b.startDate,
      endDate: b.endDate,
      days: b.days,
      status: "pending-approval",
      note: b.note,
      submittedAt: toIso(),
    });
    putRequest(created);
    storeIdempotency(idem, created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.delete("*/api/hcm/requests/:id", async ({ params, request }) => {
    const block = await preflight("DELETE", `/requests/${params.id}`, false);
    if (block) return block;

    if (shouldSilentFailMutation()) {
      return HttpResponse.json(SilentOkSchema.parse({ status: "ok" }));
    }

    const id = String(params.id);
    const existing = getRequestById(id);
    if (!existing) {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "NOT_FOUND", message: "Unknown request" }), {
        status: 404,
      });
    }
    if (existing.status === "approved" || existing.status === "denied") {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "INVALID_STATE", message: "Cannot cancel" }), {
        status: 409,
      });
    }
    if (existing.status === "cancelled") {
      return HttpResponse.json(SilentOkSchema.parse({ status: "ok" }));
    }
    const updated = HcmRequestSchema.parse({
      ...existing,
      status: "cancelled",
      decidedAt: toIso(),
      decidedBy: "mgr_maya",
    });
    putRequest(updated);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/api/hcm/requests/pending", async ({ request }) => {
    const block = await preflight("GET", "/requests/pending", false);
    if (block) return block;

    const url = new URL(request.url);
    const managerId = url.searchParams.get("managerId");
    if (!managerId) {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "VALIDATION", message: "Missing managerId" }), {
        status: 400,
      });
    }
    const list = [...getMockState().requests.values()].filter((r) => {
      if (r.status !== "pending-approval") return false;
      const mgr = employeeReportingManager(r.employeeId);
      return mgr === managerId;
    });
    list.sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
    return HttpResponse.json(z.array(HcmRequestSchema).parse(list.map((r) => HcmRequestSchema.parse(r))));
  }),

  http.get("*/api/hcm/requests/:id", async ({ params }) => {
    const block = await preflight("GET", `/requests/${params.id}`, false);
    if (block) return block;

    const id = String(params.id);
    const req = getRequestById(id);
    if (!req) {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "NOT_FOUND", message: "Unknown request" }), {
        status: 404,
      });
    }
    return jsonOk(HcmRequestSchema, req);
  }),

  http.post("*/api/hcm/requests/:id/approve", async ({ params, request }) => {
    const block = await preflight("POST", `/requests/${params.id}/approve`, false);
    if (block) return block;

    if (shouldSilentFailMutation()) {
      return HttpResponse.json(SilentOkSchema.parse({ status: "ok" }));
    }

    const id = String(params.id);
    const existing = getRequestById(id);
    if (!existing) {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "NOT_FOUND", message: "Unknown request" }), {
        status: 404,
      });
    }
    if (existing.status !== "pending-approval") {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "INVALID_STATE", message: "Not pending approval" }), {
        status: 409,
      });
    }

    let note: string | undefined;
    try {
      const text = await request.text();
      if (text) {
        const parsed = HcmApproveRequestBodySchema.safeParse(JSON.parse(text));
        if (parsed.success) note = parsed.data.note;
      }
    } catch {
      // optional body
    }

    if (mockScenarioFlags.conflictOnApproveOnce) {
      mockScenarioFlags.conflictOnApproveOnce = false;
      const c0 = getBalanceCell(existing.employeeId, existing.locationId);
      return HttpResponse.json(
        ErrorBodySchema.parse({
          code: "BALANCE_CHANGED",
          message: "Balance changed before approval",
          freshAvailable: c0?.available ?? 0,
        }),
        { status: 409 },
      );
    }

    const conflictId = mockScenarioFlags.conflictOnApproveRequestId;
    if (conflictId === id) {
      mockScenarioFlags.conflictOnApproveRequestId = null;
      const c1 = getBalanceCell(existing.employeeId, existing.locationId);
      return HttpResponse.json(
        ErrorBodySchema.parse({
          code: "BALANCE_CHANGED",
          message: "Balance changed before approval",
          freshAvailable: c1?.available ?? 0,
        }),
        { status: 409 },
      );
    }

    const cell = getBalanceCell(existing.employeeId, existing.locationId);
    if (!cell || cell.available < existing.days) {
      const fresh = cell?.available ?? 0;
      return HttpResponse.json(
        ErrorBodySchema.parse({
          code: "BALANCE_CHANGED",
          message: "Insufficient balance at approval time",
          freshAvailable: fresh,
        }),
        { status: 409 },
      );
    }

    const nextBal = applyBalanceDelta(existing.employeeId, existing.locationId, -existing.days);
    if (!nextBal) {
      return HttpResponse.json(
        ErrorBodySchema.parse({
          code: "BALANCE_CHANGED",
          message: "Missing balance cell",
          freshAvailable: 0,
        }),
        { status: 409 },
      );
    }

    const updated = HcmRequestSchema.parse({
      ...existing,
      status: "approved",
      decidedAt: toIso(),
      decidedBy: "mgr_maya",
      note: note ?? existing.note,
    });
    putRequest(updated);
    return jsonOk(HcmRequestSchema, updated);
  }),

  http.post("*/api/hcm/requests/:id/deny", async ({ params, request }) => {
    const block = await preflight("POST", `/requests/${params.id}/deny`, false);
    if (block) return block;

    if (shouldSilentFailMutation()) {
      return HttpResponse.json(SilentOkSchema.parse({ status: "ok" }));
    }

    const id = String(params.id);
    const existing = getRequestById(id);
    if (!existing) {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "NOT_FOUND", message: "Unknown request" }), {
        status: 404,
      });
    }
    if (existing.status !== "pending-approval") {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "INVALID_STATE", message: "Not pending approval" }), {
        status: 409,
      });
    }

    let bodyJson: unknown;
    try {
      bodyJson = await request.json();
    } catch {
      return HttpResponse.json(ErrorBodySchema.parse({ code: "VALIDATION", message: "Body required" }), {
        status: 400,
      });
    }
    const parsed = HcmDenyRequestBodySchema.safeParse(bodyJson);
    if (!parsed.success) {
      return HttpResponse.json(
        ErrorBodySchema.parse({ code: "VALIDATION", message: parsed.error.message }),
        { status: 400 },
      );
    }

    const updated = HcmRequestSchema.parse({
      ...existing,
      status: "denied",
      decidedAt: toIso(),
      decidedBy: "mgr_maya",
      denialReason: parsed.data.reason,
    });
    putRequest(updated);
    return jsonOk(HcmRequestSchema, updated);
  }),
];
