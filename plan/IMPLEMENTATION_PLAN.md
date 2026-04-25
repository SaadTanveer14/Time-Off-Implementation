# Time-Off Module — Implementation Plan

## Context

The UI layer is 100% complete (~2,735 lines across 20 components). Every visual state, component, and interaction currently uses hardcoded `useState` + static mock data in `src/mocks/data.ts`. The entire architecture described in `TRD.md` and `docs/ARCHITECTURE.md` — TanStack Query, Zustand, MSW, Zod, hcm-client, circuit breaker, reconciliation, observability, testing infrastructure, CI — is absent. This plan wires the existing UI to the full data layer and builds the spec-compliant test suite.

**Package manager:** npm  
**Working directory:** `Time-Off/Time-Off-Implementation/`

---

## Current State vs Target State

| Layer | Target (TRD) | Current | Status |
|---|---|---|---|
| Presentation (React components) | Full component tree | All components built with hardcoded state | 80% — needs rewiring |
| Server state (TanStack Query) | Hooks for all queries/mutations | None | Missing |
| Client state (Zustand) | Stores for ephemeral UI state | Inline `useState` | Missing |
| Network boundary (hcm-client.ts) | Single HTTP module with Zod validation | None | Missing |
| Mock HCM (MSW) | Stateful, scenario-driven mock | Static `data.ts` file | Missing |
| Schemas (Zod) | Single source of all types | Hand-written types in `types.ts` | Partial |
| Infrastructure utilities | circuit-breaker, observability, state-machine, reconciliation | None | Missing |
| Testing | Vitest + RTL + Storybook + Playwright | None | Missing |
| CI | GitHub Actions pipeline | None | Missing |

---

## Phase 1 — Dependencies & Configuration

**Goal:** Install all required packages and configure tooling.

### Install production dependencies
```bash
npm install @tanstack/react-query@^5 zustand zod date-fns
```

### Install dev dependencies
```bash
npm install -D \
  @tanstack/react-query-devtools \
  msw@^2 \
  vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  @testing-library/jest-axe @axe-core/react \
  @storybook/nextjs @storybook/addon-essentials @storybook/addon-interactions \
  @storybook/addon-a11y msw-storybook-addon @storybook/test-runner \
  playwright @playwright/test \
  @next/bundle-analyzer \
  stryker @stryker-mutator/vitest-runner @stryker-mutator/typescript-checker
```

### Files to create
- `vitest.config.ts` — jsdom env, coverage thresholds (85% statements, 80% branches)
- `.storybook/main.ts` — Next.js framework, MSW + interactions + a11y addons
- `.storybook/preview.ts` — global MSW decorator, state reset before each story
- `playwright.config.ts` — baseURL, trace on failure
- `.env.example` / `.env.local` — `NEXT_PUBLIC_USE_MSW=true`, `NEXT_PUBLIC_RECONCILE_INTERVAL_MS=60000`

### `package.json` scripts to add
`test`, `test:integration`, `test:e2e`, `test:contract`, `storybook`, `build-storybook`, `test-storybook`, `check-story-coverage`, `typecheck`, `analyze`, `chromatic`, `mutation`

**Verification:** `npm run typecheck` passes. `npm run dev` still boots.

---

## Phase 2 — Type System & Schemas

**Goal:** Migrate hand-written types to Zod schemas as the single source of truth.

### Files to create
- `src/schemas/hcm.ts` — All Zod schemas:
  - `EmployeeIdSchema`, `LocationIdSchema`, `RequestIdSchema` (UUIDs)
  - `BalanceSchema` — `{ employeeId, locationId, locationName, available, accrualRate?, updatedAt }`
  - `BatchBalancesResponseSchema` — `{ employeeId, balances[], corpusVersion }`
  - `RequestStatusSchema` — enum: `draft | pending-submit | pending-approval | approved | denied | cancelled`
  - `RequestSchema`, `PendingApprovalSchema`, `EmployeeSchema`
  - `HcmErrorSchema` with `code` discriminant
- `src/copy.ts` — Every user-facing string extracted from components, covering all states in `UX_STATE_MATRIX.md`

### Files to modify
- `src/lib/types.ts` — Re-export types as `z.infer<typeof XSchema>` aliases (keeps existing component imports working)

**Verification:** `npm run typecheck` passes. No component imports break.

---

## Phase 3 — Query Infrastructure

**Goal:** TanStack Query setup with canonical key factory and tuned QueryClient.

### Files to create
- `src/lib/query-keys.ts` — `qk` factory: `qk.balance(eId, lId)`, `qk.batchBalances(eId)`, `qk.requestsByEmployee(eId)`, `qk.requestsPendingForManager(mgrId)`, `qk.request(rId)`
- `src/lib/query-client.ts` — `makeQueryClient()` with per-key staleTime/gcTime:

| Key | staleTime | gcTime | refetchOnWindowFocus | refetchInterval |
|---|---|---|---|---|
| `balance` | 5s | 5min | true | — |
| `batchBalances` | 30s | 10min | false | 60s (focused) |
| `requestsByEmployee` | 10s | 10min | true | — |
| `requestsPendingForManager` | 5s | 10min | true | 15s (focused) |
| `request` | 5s | 5min | true | — |

`refetchIntervalInBackground: false` as global default.

### Files to modify
- `src/app/layout.tsx` — Wrap children in `<QueryClientProvider>`, add `<ReactQueryDevtools>` (dev-only)

**Verification:** Dev server boots. ReactQueryDevtools panel visible in browser.

---

## Phase 4 — Mock HCM (MSW)

**Goal:** Stateful, scenario-driven mock server replacing hardcoded data.

### Files to create
- `src/mocks/hcm/state.ts` — In-memory `MockState` with `Map`s for employees, balances, requests, idempotency log. `reset(seed?)` restores known seed data.
- `src/mocks/hcm/clock.ts` — `getNow()` — `Date.now()` in prod, fake-timer-compatible in tests
- `src/mocks/hcm/handlers.ts` — MSW handlers for all 9 endpoints:
  - `GET /api/hcm/balances?employeeId&locationId`
  - `GET /api/hcm/balances/all?employeeId`
  - `PATCH /api/hcm/balances`
  - `GET /api/hcm/requests?employeeId`
  - `POST /api/hcm/requests` (idempotency via `Idempotency-Key` header)
  - `DELETE /api/hcm/requests/:id`
  - `GET /api/hcm/requests/pending?managerId`
  - `POST /api/hcm/requests/:id/approve`
  - `POST /api/hcm/requests/:id/deny`
- `src/mocks/hcm/scenarios.ts` — Named composable scenarios: `happyPath`, `offline`, `silentFailRate(p)`, `silentFailOnce`, `rejectInsufficientAt(cell)`, `anniversaryTickAt(ms)`, `yearStartAt(ms)`, `conflictOnApprove(rId)`, `externalBalanceEdit(cell, delta)`, `hcmMaintenance`, `partialFail(cells)`, `circuitOpen(closeAfterMs)`, `slowBatch(ms)`, `compose(...scenarios)`
- `src/mocks/browser.ts` — MSW service worker setup for dev/Storybook
- `src/mocks/server.ts` — MSW Node.js server for Vitest

**Verification:** `npm run dev` with `NEXT_PUBLIC_USE_MSW=true` — network calls visible as intercepted in browser DevTools.

---

## Phase 5 — Network Layer (hcm-client.ts)

**Goal:** The only file allowed to call `fetch`. All HCM communication goes through here.

### Files to create
- `src/lib/hcm-client.ts` — One exported function per HCM operation, each:
  1. Builds URL from `NEXT_PUBLIC_HCM_BASE_URL`
  2. Calls `fetch` (sole usage in the codebase)
  3. Validates response with matching Zod schema — throws `ZodError` on mismatch
  4. Translates HTTP errors to typed `HcmError` objects

  Functions: `getBalance`, `getBatchBalances`, `getRequests`, `getPendingRequests`, `getRequest`, `submitRequest`, `cancelRequest`, `approveRequest`, `denyRequest`

**Verification:** Manually call one function in browser console — MSW intercepts, Zod validates. Break a schema field to confirm validation throws.

---

## Phase 6 — Infrastructure Utilities

**Goal:** Pure-logic utilities used by hooks and the network layer.

### Files to create
- `src/lib/request-state-machine.ts` — Pure `transition(current, event): Result`. Full table from `ARCHITECTURE.md §4`. Dev-mode throw on illegal transitions.
- `src/lib/circuit-breaker.ts` — Sliding 30s window, 3-state machine (`closed → open → half-open → closed`). `recordSuccess()`, `recordFailure()`, `probe()`. Returns `CircuitOpenError` without hitting network when open.
- `src/lib/observability.ts` — `emit(event)` wrapper. `EventName` union from `TRD.md §20`. `console.debug` in dev, real sink in prod.
- `src/lib/reconciliation.ts` — `diffAgainstCache(queryClient, fresh)` → `BalanceDiff[]`. `categorizeDrift(diff, metadata)` → `anniversary_bonus | year_start_reset | unknown`.
- `src/lib/broadcast-channel.ts` — Thin `BroadcastChannel` wrapper. Fake-replaceable for tests.
- `src/lib/idempotency.ts` — `generateIdempotencyKey()` via `crypto.randomUUID()`. Stubbable.

**Verification:** Unit tests for each utility pass. `npm test` green.

---

## Phase 7 — Server State Hooks (TanStack Query)

**Goal:** All query and mutation hooks consumed by components.

### Files to create
- `src/hooks/useAuth.ts` — Returns `{ employeeId, managerId, roles }`. `MockAuthProvider` in dev/tests.
- `src/hooks/useBalances.ts` — `useBalance(eId, lId)`, `useBatchBalances(eId)`
- `src/hooks/useRequests.ts` — `useRequests(eId)`, `usePendingRequests(mgrId)`, `useRequest(rId)`
- `src/hooks/useSubmitRequest.ts` — Optimistic mutation: `onMutate` snapshots + applies → `onError` rolls back + retains draft → `onSuccess` verification read → `onSettled` invalidates + broadcasts
- `src/hooks/useCancelRequest.ts` — Optimistic with 5s undo window
- `src/hooks/useApproveRequest.ts` — Pessimistic: pre-flight balance fetch → `ConflictError` if stale → `onError` opens conflict modal
- `src/hooks/useDenyRequest.ts` — Pessimistic, simpler (no conflict check)
- `src/hooks/useReconciliationLoop.ts` — `useQuery` with `refetchInterval: RECONCILE_INTERVAL_MS`, diffs cache on success, enqueues drift notifications

**Verification:** Optimistic updates visible in ReactQueryDevtools. Network tab shows MSW interception.

---

## Phase 8 — Client State (Zustand Stores)

**Goal:** Replace inline `useState` with Zustand stores for all ephemeral UI state.

### Files to create (all in `src/state/`)
- `request-draft.store.ts` — `locationId`, `startDate`, `endDate`, `note`, `retainedUntil?`. Actions: `setField`, `reset`, `retain(ttlMs)`
- `manager-filters.store.ts` — `filter` (`pending | approved | denied`), `selectedId`. Actions: `setFilter`, `setSelected`
- `toast-queue.store.ts` — `toasts[]` with auto-dismiss (4s success, 5s info, 6s warning, sticky error)
- `drift-notifications.store.ts` — `notifications[]` with `enqueue`, `dismiss`
- `conflict-modal.store.ts` — `open`, `requestId?`, `staleBalance?`, `liveBalance?`
- `circuit-breaker.store.ts` — Wraps `circuit-breaker.ts`. Must NOT import `@tanstack/react-query`.

**Verification:** Zustand DevTools shows all stores and live updates.

---

## Phase 9 — Wire Components + SSR Hydration

**Goal:** Remove all `useState`/hardcoded data; connect components to hooks and stores.

### Files to modify heavily
- `src/components/employee/EmployeeView.tsx` — Replace `useState` with `useBatchBalances`, `useRequests`, `useSubmitRequest`, `useCancelRequest`, `useReconciliationLoop`. Remove `src/mocks/data.ts` imports.
- `src/components/manager/ManagerView.tsx` — Replace `useState` with `useManagerFiltersStore`, `usePendingRequests`, `useApproveRequest`, `useDenyRequest`. Remove random 50% conflict simulation.
- `src/app/layout.tsx` — Add `<GlobalBanner>`, `<NotificationLayer>`, `<AuthProvider>`, `<ReactQueryDevtools>`
- `src/app/time-off/page.tsx` — SSR prefetch: `prefetchQuery(batchBalances)` + `prefetchQuery(requests)` + `<HydrationBoundary>`
- `src/app/time-off/manager/page.tsx` — SSR prefetch: `prefetchQuery(pendingRequests)` + `<HydrationBoundary>`

### New components
- `src/components/shared/GlobalBanner.tsx` — Reads circuit-breaker + offline stores. 5 banner states from `UX_STATE_MATRIX.md`.
- `src/components/shared/NotificationLayer.tsx` — Reads `useToastQueue`. Renders toasts + drift notifications.
- `src/components/shared/AuthGate.tsx` — Wraps routes; loading/error if auth not ready.

**Verification:** No spinners on first paint (SSR hydration). Optimistic updates instant. Two tabs sync via BroadcastChannel.

---

## Phase 10 — Testing Infrastructure

**Goal:** Configure all test tooling so Phase 11 tests can run.

### Files to create
- `vitest.config.ts` — jsdom, globals, setupFiles, coverage thresholds
- `tests/setup.ts` — `@testing-library/jest-dom`, MSW server lifecycle
- `tests/utils/render.tsx` — `renderWithProviders()` with full provider tree
- `.storybook/main.ts` + `.storybook/preview.ts` — MSW addon, a11y addon, global decorator
- `playwright.config.ts` — baseURL, trace on failure, workers: 1
- `scripts/check-story-coverage.ts` — Parses `UX_STATE_MATRIX.md`, verifies story-per-state exists

**Verification:** `npm test` runs cleanly (0 tests). `npm run storybook` boots. Coverage report generates.

---

## Phase 11 — Test Suite

**Goal:** Full behavioral coverage. Every spec behavior has a guard.

### Unit tests (`tests/unit/`)
`query-keys.test.ts`, `request-state-machine.test.ts`, `circuit-breaker.test.ts`, `reconciliation.test.ts`, `date-utils.test.ts`, `idempotency.test.ts`

### Component tests (`tests/components/`)
One file per component. Accessible queries only (`getByRole`, `getByLabelText`). No `getByTestId` for primary assertions.

### Integration tests (`tests/integration/`)
All 20 scenarios from `TESTING_STRATEGY.md §4.4` (I-1 through I-20). All use `vi.useFakeTimers()`.

### Contract tests (`tests/contract/`)
9 endpoints × 2 directions = ~18 tests. Zod schema rejects malformed responses. Mock emits schema-valid responses.

### Storybook stories (`stories/`)
One story per row in `UX_STATE_MATRIX.md`. Each story has `parameters.msw` + `play` function.

### E2E tests (`tests/e2e/`)
7 Playwright journeys (E-1 through E-7).

**Verification:** `npm test` ≥85% statements, ≥80% branches. `npm run test-storybook` all pass. `npm run test:e2e` all pass.

---

## Phase 12 — CI Pipeline

**Goal:** GitHub Actions prevents regressions from merging.

### File to create
- `.github/workflows/ci.yml` — Stages: install → typecheck + lint → test + integration + contract → coverage → storybook build + test → Next.js build → bundle budget → E2E (nightly) → Chromatic

**Verification:** Deliberate test failure → CI fails. Missing story → lint fails.

---

## Files Created/Modified Summary

| File | Action | Phase |
|---|---|---|
| `src/schemas/hcm.ts` | Create | 2 |
| `src/copy.ts` | Create | 2 |
| `src/lib/query-keys.ts` | Create | 3 |
| `src/lib/query-client.ts` | Create | 3 |
| `src/mocks/hcm/state.ts` | Create | 4 |
| `src/mocks/hcm/clock.ts` | Create | 4 |
| `src/mocks/hcm/handlers.ts` | Create | 4 |
| `src/mocks/hcm/scenarios.ts` | Create | 4 |
| `src/mocks/browser.ts` | Create | 4 |
| `src/mocks/server.ts` | Create | 4 |
| `src/lib/hcm-client.ts` | Create | 5 |
| `src/lib/request-state-machine.ts` | Create | 6 |
| `src/lib/circuit-breaker.ts` | Create | 6 |
| `src/lib/observability.ts` | Create | 6 |
| `src/lib/reconciliation.ts` | Create | 6 |
| `src/lib/broadcast-channel.ts` | Create | 6 |
| `src/lib/idempotency.ts` | Create | 6 |
| `src/hooks/useAuth.ts` | Create | 7 |
| `src/hooks/useBalances.ts` | Create | 7 |
| `src/hooks/useRequests.ts` | Create | 7 |
| `src/hooks/useSubmitRequest.ts` | Create | 7 |
| `src/hooks/useCancelRequest.ts` | Create | 7 |
| `src/hooks/useApproveRequest.ts` | Create | 7 |
| `src/hooks/useDenyRequest.ts` | Create | 7 |
| `src/hooks/useReconciliationLoop.ts` | Create | 7 |
| `src/state/request-draft.store.ts` | Create | 8 |
| `src/state/manager-filters.store.ts` | Create | 8 |
| `src/state/toast-queue.store.ts` | Create | 8 |
| `src/state/drift-notifications.store.ts` | Create | 8 |
| `src/state/conflict-modal.store.ts` | Create | 8 |
| `src/state/circuit-breaker.store.ts` | Create | 8 |
| `src/components/shared/GlobalBanner.tsx` | Create | 9 |
| `src/components/shared/NotificationLayer.tsx` | Create | 9 |
| `src/components/shared/AuthGate.tsx` | Create | 9 |
| `src/app/layout.tsx` | Modify | 9 |
| `src/app/time-off/page.tsx` | Modify | 9 |
| `src/app/time-off/manager/page.tsx` | Modify | 9 |
| `src/components/employee/EmployeeView.tsx` | Modify | 9 |
| `src/components/manager/ManagerView.tsx` | Modify | 9 |
| `src/lib/types.ts` | Modify | 2 |
| `package.json` | Modify | 1 |
| `vitest.config.ts` | Create | 10 |
| `tests/setup.ts` | Create | 10 |
| `tests/utils/render.tsx` | Create | 10 |
| `.storybook/main.ts` | Create | 10 |
| `.storybook/preview.ts` | Create | 10 |
| `playwright.config.ts` | Create | 10 |
| `scripts/check-story-coverage.ts` | Create | 10 |
| All test files | Create | 11 |
| `.github/workflows/ci.yml` | Create | 12 |
