/**
 * Re-exports domain types and Zod schemas from `src/schemas/hcm.ts`.
 * Import types from here (`@/lib/types`) so call sites stay stable.
 */

export type {
  Balance,
  BalanceCardState,
  Employee,
  Location,
  LocationId,
  PendingApproval,
  RequestStatus,
  TimeOffRequest,
  HcmBalanceCell,
  HcmBatchBalanceRow,
  HcmBatchBalancesResponse,
  HcmRequest,
  HcmRequestStatus,
  HcmErrorBody,
  HcmPatchBalanceBody,
  HcmSubmitRequestBody,
  HcmApproveRequestBody,
  HcmDenyRequestBody,
} from "@/schemas/hcm";

export {
  BalanceSchema,
  BalanceCardStateSchema,
  EmployeeSchema,
  LocationSchema,
  LocationIdSchema,
  PendingApprovalSchema,
  RequestStatusSchema,
  TimeOffRequestSchema,
  IsoDateStringSchema,
  IsoDateTimeStringSchema,
  EmployeeIdSchema,
  ManagerIdSchema,
  RequestIdSchema,
  HcmBalanceCellSchema,
  HcmBatchBalanceRowSchema,
  HcmBatchBalancesResponseSchema,
  HcmRequestSchema,
  HcmRequestStatusSchema,
  HcmErrorBodySchema,
  HcmKnownErrorCodeSchema,
  HcmLocationIdSchema,
  HcmPatchBalanceBodySchema,
  HcmSubmitRequestBodySchema,
  HcmApproveRequestBodySchema,
  HcmDenyRequestBodySchema,
} from "@/schemas/hcm";
