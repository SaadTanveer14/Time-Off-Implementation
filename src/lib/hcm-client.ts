import { z } from "zod";
import {
  HcmApproveRequestBodySchema,
  HcmBalanceCellSchema,
  HcmBatchBalancesResponseSchema,
  HcmDenyRequestBodySchema,
  HcmErrorBodySchema,
  HcmPatchBalanceBodySchema,
  HcmRequestSchema,
  HcmSubmitRequestBodySchema,
} from "@/schemas/hcm";

const HcmRequestListSchema = z.array(HcmRequestSchema);
const SilentOkSchema = z.object({ status: z.literal("ok") });

const DEFAULT_HCM_BASE_URL = "http://localhost:3000/api/hcm";

export type HcmError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

export class HcmClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(hcmError: HcmError) {
    super(hcmError.message);
    this.name = "HcmClientError";
    this.status = hcmError.status;
    this.code = hcmError.code;
    this.details = hcmError.details;
  }
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_HCM_BASE_URL ?? DEFAULT_HCM_BASE_URL;
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(`${getBaseUrl()}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function safeReadJson(response: Response): Promise<unknown | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function parseError(status: number, payload: unknown): HcmClientError {
  const parsed = HcmErrorBodySchema.safeParse(payload);
  if (parsed.success) {
    return new HcmClientError({
      status,
      code: parsed.data.code,
      message: parsed.data.message,
      details: payload,
    });
  }
  return new HcmClientError({
    status,
    code: "HTTP_ERROR",
    message: `HCM request failed with status ${status}`,
    details: payload,
  });
}

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const response = await fetch(buildUrl(path, params), init);
  const payload = await safeReadJson(response);

  if (!response.ok) {
    throw parseError(response.status, payload);
  }

  return schema.parse(payload);
}

export function getBalance(employeeId: string, locationId: string) {
  return request("/balances", HcmBalanceCellSchema, undefined, { employeeId, locationId });
}

export function getBatchBalances(employeeId: string) {
  return request("/balances/all", HcmBatchBalancesResponseSchema, undefined, { employeeId });
}

export function getRequests(employeeId: string) {
  return request("/requests", HcmRequestListSchema, undefined, { employeeId });
}

export function getPendingRequests(managerId: string) {
  return request("/requests/pending", HcmRequestListSchema, undefined, { managerId });
}

export function getRequest(requestId: string) {
  return request(`/requests/${encodeURIComponent(requestId)}`, HcmRequestSchema);
}

export function submitRequest(input: z.input<typeof HcmSubmitRequestBodySchema>, idempotencyKey: string) {
  const body = HcmSubmitRequestBodySchema.parse(input);
  return request("/requests", HcmRequestSchema, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
}

export function cancelRequest(requestId: string) {
  return fetch(buildUrl(`/requests/${encodeURIComponent(requestId)}`), {
    method: "DELETE",
  }).then(async (response) => {
    const payload = await safeReadJson(response);
    if (!response.ok) {
      throw parseError(response.status, payload);
    }
    if (response.status === 204 || payload === null) {
      return { status: "ok" as const };
    }
    return SilentOkSchema.parse(payload);
  });
}

export function approveRequest(requestId: string, note?: string) {
  const body = HcmApproveRequestBodySchema.parse({ note });
  return request(`/requests/${encodeURIComponent(requestId)}/approve`, HcmRequestSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function denyRequest(requestId: string, reason: string) {
  const body = HcmDenyRequestBodySchema.parse({ reason });
  return request(`/requests/${encodeURIComponent(requestId)}/deny`, HcmRequestSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
