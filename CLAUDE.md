# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Next.js dev server with MSW-backed mock HCM
npm run build            # Production build
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npm run analyze          # Bundle size report

# Tests
npm test                        # Unit + component (Vitest + React Testing Library)
npm run test:integration        # Integration tests (with MSW)
npm run test:e2e                # Playwright E2E
npm run test:contract           # Zod schema contract tests
npm run test:coverage           # Tests with coverage report

# Storybook
npm run storybook               # Run Storybook (full UX state catalog)
npm run build-storybook         # Build static Storybook
npm run check-story-coverage    # Verify UX state matrix ↔ story mapping (required in CI)

# Other
npm run chromatic        # Push visual snapshots to Chromatic
npm run mutation         # StrykerJS mutation tests (slow; runs weekly in CI)
```

Environment: copy `.env.example` → `.env.local`. Key vars: `NEXT_PUBLIC_USE_MSW=true`, `NEXT_PUBLIC_RECONCILE_INTERVAL_MS=60000`.

## Architecture

This is a **specification-first** project — the TRD and docs are the primary deliverable. `TRD.md` is the source of truth; `docs/ARCHITECTURE.md` is the mechanical reference for diagrams and data flows.

### Five-layer model (strictly enforced)

```
Presentation (React components)
    ↓ reads only
Server State (TanStack Query hooks)
    ↓ calls only
Client State (Zustand stores — no network)
    ↓ never crosses
Network Boundary (src/lib/hcm-client.ts — the ONLY file that calls fetch/axios)
    ↓ exercises
Mock HCM (MSW handlers — replaces real HCM in dev, Storybook, tests)
```

**Invariants enforced by ESLint:**
- `*.store.ts` files may not import `@tanstack/react-query`
- Only `src/lib/hcm-client.ts` may call `fetch` or `axios`
- Only `src/lib/query-keys.ts` may define query keys
- All types derive from Zod schemas via `z.infer<typeof X>` — no hand-written types that shadow a schema
- All user-facing strings live in `src/copy.ts`, not inline in components

### Routes

| Route | View |
|---|---|
| `/time-off` | Employee view (balances + request composer + history) |
| `/time-off/manager` | Manager view (pending approval queue) |
| `/time-off/states` | UX state showcase (dev/demo) |

### Key source locations

| Path | Purpose |
|---|---|
| `src/lib/hcm-client.ts` | Only HTTP layer; validates every response with Zod |
| `src/lib/query-keys.ts` | Single source of all TanStack Query keys |
| `src/lib/query-client.ts` | QueryClient config (stale times, gc times per key) |
| `src/lib/request-state-machine.ts` | Pure `transition(current, event)` function; exhaustively tested |
| `src/lib/circuit-breaker.ts` | Sliding-window circuit breaker over hcm-client calls |
| `src/lib/observability.ts` | Thin emit wrapper; ships to real sink in prod, console.debug in dev |
| `src/schemas/hcm.ts` | All Zod schemas; TypeScript types derived from these |
| `src/state/*.store.ts` | Zustand stores for ephemeral UI state only |
| `src/hooks/` | TanStack Query hooks consumed by components |
| `src/mocks/hcm/handlers/` | MSW handlers implementing mock HCM |
| `src/copy.ts` | Every user-visible string |

### Data patterns

**Optimistic mutations** (employee submit, cancel): `onMutate` snapshots cache → applies optimistic update → `onError` rolls back → `onSettled` always invalidates + broadcasts to sibling tabs via `BroadcastChannel`.

**Pessimistic mutations** (manager approve/deny): fetches fresh balance before calling HCM; shows `<ConflictModal>` if balance is stale rather than applying any optimistic update.

**Reconciliation loop**: `useReconciliationLoop` polls `qk.batchBalances` every 60s while tab is focused (`refetchIntervalInBackground: false`). Diffs against cache and enqueues drift notifications.

**SSR hydration**: Server Components prefetch `batchBalances` and `requestsByEmployee`, pass `dehydrate(queryClient)` to `<HydrationBoundary>` — client renders without spinners on first paint.

### Adding things

- **New mutation**: follow `useSubmitRequest` pattern; document optimistic vs pessimistic choice in JSDoc per `TRD.md §11.1`.
- **New HCM endpoint**: schema in `src/schemas/hcm.ts` → MSW handler → contract test → client method → hook.
- **New UX state**: add row to `docs/UX_STATE_MATRIX.md` + Storybook story with `play` function → `pnpm check-story-coverage` must pass.
- **New observability event**: add to catalog in `TRD.md §20` and to `EventName` union in `src/lib/observability.ts`.

## Testing rules

- Accessible queries only (`getByRole`, `getByLabelText`). No new `getByTestId` for primary assertions.
- No real `setTimeout` or `Date.now()` in tests — always fake timers.
- MSW is the only network mock — no ad-hoc `jest.fn()` on fetch.
- CI enforces 85% branch / 80% line coverage; do not lower thresholds.
