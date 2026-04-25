import { z, type output } from "zod";

/**
 * Canonical Zod models for Time-Off.
 *
 * - **UI** schemas mirror the current React components (`Balance.days`, epoch `submittedAt`, etc.).
 * - **HCM wire** schemas mirror `docs/MOCK_HCM_SPEC.md` / TRD §15 for `hcm-client` + MSW (Phase 4–5).
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** `YYYY-MM-DD` — TRD: date-only strings over the wire. */
export const IsoDateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date string");

/**
 * ISO-8601 / RFC 3339 datetime string from HCM (e.g. `2026-04-24T10:12:00Z`).
 * Parsed with `Date.parse` for broad interoperability with mock + real HCM.
 */
export const IsoDateTimeStringSchema = z
  .string()
  .min(4)
  .refine((s) => !Number.isNaN(Date.parse(s)), "Expected parseable ISO-8601 datetime");

/**
 * TRD recommends UUIDs; current fixtures use prefixed ids (`emp_alex`).
 * Wire layer accepts any non-empty string until the mock migrates to UUIDs.
 */
export const EmployeeIdSchema = z.string().min(1);
export const ManagerIdSchema = z.string().min(1);
export const RequestIdSchema = z.string().min(1);

/** Location slug used in the present UI. */
export const LocationIdSchema = z.enum(["ny-hq", "remote", "sf"]);

/** Location id as returned on HCM wire (UUID in production; may match UI slug in mock). */
export const HcmLocationIdSchema = z.string().min(1);

// ---------------------------------------------------------------------------
// UI domain (current components)
// ---------------------------------------------------------------------------

export const BalanceCardStateSchema = z.enum([
  "loading",
  "loaded-fresh",
  "loaded-stale",
  "optimistic-pending",
  "optimistic-rolled-back",
  "optimistic-confirmed",
  "anniversary-bonus",
  "reconciled",
  "error",
]);

export const BalanceSchema = z.object({
  locationId: LocationIdSchema,
  locationName: z.string(),
  days: z.number().int().nonnegative(),
  syncedAt: z.number(),
  accrualPerMonth: z.number().nonnegative().optional(),
  state: BalanceCardStateSchema,
  previousDays: z.number().int().nonnegative().optional(),
  isPrimary: z.boolean().optional(),
});

export const RequestStatusSchema = z.enum([
  "submitting",
  "pending",
  "approved",
  "denied",
  "cancelled",
]);

export const TimeOffRequestSchema = z.object({
  id: RequestIdSchema,
  employeeId: EmployeeIdSchema,
  employeeName: z.string(),
  locationId: LocationIdSchema,
  locationName: z.string(),
  startDate: IsoDateStringSchema,
  endDate: IsoDateStringSchema,
  days: z.number().int().positive(),
  status: RequestStatusSchema,
  note: z.string().max(500).optional(),
  submittedAt: z.number(),
  decidedAt: z.number().optional(),
  optimistic: z.boolean().optional(),
});

export const PendingApprovalSchema = TimeOffRequestSchema.extend({
  employeeAvatarColor: z.string(),
  employeeRole: z.string(),
  freshBalanceDays: z.number().int().nonnegative(),
  freshBalanceReadAt: z.number(),
});

export const LocationSchema = z.object({
  id: LocationIdSchema,
  name: z.string(),
  shortName: z.string(),
});

export const EmployeeSchema = z.object({
  id: EmployeeIdSchema,
  name: z.string(),
  initials: z.string(),
  role: z.string(),
  primaryLocationId: LocationIdSchema,
  avatarColor: z.string(),
});

// ---------------------------------------------------------------------------
// HCM wire — single cell balance (GET/PATCH response body shape)
// ---------------------------------------------------------------------------

export const HcmBalanceCellSchema = z.object({
  employeeId: EmployeeIdSchema,
  locationId: HcmLocationIdSchema,
  locationName: z.string(),
  available: z.number().int().nonnegative(),
  accrualRate: z.number().nonnegative().optional(),
  updatedAt: IsoDateTimeStringSchema,
});

export const HcmBatchBalanceRowSchema = z.object({
  locationId: HcmLocationIdSchema,
  locationName: z.string(),
  available: z.number().int().nonnegative(),
  accrualRate: z.number().nonnegative().optional(),
  updatedAt: IsoDateTimeStringSchema,
});

export const HcmBatchBalancesResponseSchema = z.object({
  employeeId: EmployeeIdSchema,
  balances: z.array(HcmBatchBalanceRowSchema),
  corpusVersion: z.number().int().nonnegative(),
});

/** POST/PATCH bodies from MOCK_HCM_SPEC §2.2, §2.5 */
export const HcmPatchBalanceBodySchema = z.object({
  employeeId: EmployeeIdSchema,
  locationId: HcmLocationIdSchema,
  delta: z.number().int(),
});

export const HcmSubmitRequestBodySchema = z.object({
  employeeId: EmployeeIdSchema,
  locationId: HcmLocationIdSchema,
  startDate: IsoDateStringSchema,
  endDate: IsoDateStringSchema,
  days: z.number().int().positive(),
  note: z.string().max(500).optional(),
});

export const HcmApproveRequestBodySchema = z.object({
  note: z.string().max(500).optional(),
});

export const HcmDenyRequestBodySchema = z.object({
  reason: z.string().min(1),
});

// ---------------------------------------------------------------------------
// HCM wire — request entity (canonical lifecycle from TRD / ARCHITECTURE §4)
// ---------------------------------------------------------------------------

export const HcmRequestStatusSchema = z.enum([
  "draft",
  "pending-submit",
  "pending-approval",
  "approved",
  "denied",
  "cancelled",
]);

export const HcmRequestSchema = z.object({
  id: RequestIdSchema,
  employeeId: EmployeeIdSchema,
  locationId: HcmLocationIdSchema,
  startDate: IsoDateStringSchema,
  endDate: IsoDateStringSchema,
  days: z.number().int().positive(),
  status: HcmRequestStatusSchema,
  note: z.string().max(500).optional(),
  submittedAt: IsoDateTimeStringSchema,
  decidedAt: IsoDateTimeStringSchema.optional(),
  decidedBy: z.string().optional(),
  denialReason: z.string().optional(),
});

export const HcmErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const HcmKnownErrorCodeSchema = z.enum([
  "INSUFFICIENT_BALANCE",
  "INVALID_DIMENSION",
  "VALIDATION",
  "BALANCE_CHANGED",
]);

// ---------------------------------------------------------------------------
// Inferred TypeScript types
// ---------------------------------------------------------------------------

export type LocationId = output<typeof LocationIdSchema>;
export type BalanceCardState = output<typeof BalanceCardStateSchema>;
export type Balance = output<typeof BalanceSchema>;
export type RequestStatus = output<typeof RequestStatusSchema>;
export type TimeOffRequest = output<typeof TimeOffRequestSchema>;
export type PendingApproval = output<typeof PendingApprovalSchema>;
export type Location = output<typeof LocationSchema>;
export type Employee = output<typeof EmployeeSchema>;

export type HcmBalanceCell = output<typeof HcmBalanceCellSchema>;
export type HcmBatchBalanceRow = output<typeof HcmBatchBalanceRowSchema>;
export type HcmBatchBalancesResponse = output<typeof HcmBatchBalancesResponseSchema>;
export type HcmRequest = output<typeof HcmRequestSchema>;
export type HcmRequestStatus = output<typeof HcmRequestStatusSchema>;
export type HcmErrorBody = output<typeof HcmErrorBodySchema>;
export type HcmPatchBalanceBody = output<typeof HcmPatchBalanceBodySchema>;
export type HcmSubmitRequestBody = output<typeof HcmSubmitRequestBodySchema>;
export type HcmApproveRequestBody = output<typeof HcmApproveRequestBodySchema>;
export type HcmDenyRequestBody = output<typeof HcmDenyRequestBodySchema>;
