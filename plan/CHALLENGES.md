# Implementation Challenges Log

This file is updated as implementation progresses. Each entry records the challenge, its root cause, and how it was resolved. Unresolved challenges are marked `[OPEN]`.

---

## Format

```
## [Phase X] Challenge Title — [RESOLVED | OPEN | WORKAROUND]

**Encountered:** <when/where>
**Root cause:** <what caused it>
**Impact:** <what it blocked or broke>
**Resolution:** <what fixed it, or current status if open>
```

---

## [Phase 1] @storybook/test-runner incompatible with Storybook 8 — WORKAROUND

**Encountered:** Phase 1 dev dependency install  
**Root cause:** `@storybook/test-runner` jumped from targeting Storybook 8 to requiring `storybook@^10.0.0`. No intermediate stable version exists. All `@storybook/test-runner` stable releases (0.24.x) peer-require Storybook v10, while the installed addon suite is on Storybook v8.6.x.  
**Impact:** `@storybook/test-runner` not installed. Storybook `play` function CI automation deferred.  
**Resolution (workaround):** Skipped for Phase 1. In Phase 10/11 we choose one of: (a) upgrade all Storybook packages to v10 and install the compatible test-runner — preferred if Next.js 14 / Storybook 10 pairing is stable; (b) run Storybook interaction tests via Playwright against the static Storybook build.

---

## [Phase 1] Zod v4 installed (plan referenced v3 APIs) — MONITOR

**Encountered:** Phase 1 production install — `npm install zod` resolved to `v4.3.6`.  
**Root cause:** TRD/docs were written against Zod v3 APIs. Zod v4 introduces some breaking changes (error formatting, stricter `undefined` handling, `z.string().email()` behavior).  
**Impact:** Minor risk of API divergence when writing schemas in Phase 2.  
**Resolution:** Proceeding with Zod v4 as it is the actively maintained version. Will verify each schema against v4 docs during Phase 2. Will pin to `zod@^3.23` if an incompatibility is found.

---

## [Phase 1] vitest exits code 1 with no test files — RESOLVED

**Encountered:** Phase 1 verification — `npm test` failed with exit code 1 and "No test files found".  
**Root cause:** `vitest run` exits non-zero when no test files match the include globs. This is default vitest behavior.  
**Impact:** CI would fail before any tests are written.  
**Resolution:** Added `--passWithNoTests` flag to the `test` script. Will be removed in Phase 11 once the full test suite is in place.

<!-- New challenges appended below -->

## [Phase 2] Dual domain models (UI vs HCM wire) caused schema ambiguity — RESOLVED

**Encountered:** While creating `src/schemas/hcm.ts` and migrating types to Zod-backed exports.  
**Root cause:** Existing UI uses local ids/status values (`pending`, location slugs, epoch timestamps), while Phase 4/5 wire contract requires different lifecycle/status and datetime formats (`pending-approval`, ISO datetimes, broader location id shape).  
**Impact:** Risk of breaking current UI while introducing wire-accurate models for upcoming `hcm-client` + MSW layers.  
**Resolution:** Split schemas into two explicit groups in `src/schemas/hcm.ts`: UI domain schemas and HCM wire schemas; re-exported both through `src/lib/types.ts` to preserve component imports while enabling strict wire validation.

---

## [Phase 2] Zod v4 output typing differences vs earlier docs — RESOLVED

**Encountered:** During type alias migration from hand-written interfaces to schema-derived types.  
**Root cause:** Zod v4 typing ergonomics differ from older examples (notably around inference helpers and stricter optional handling).  
**Impact:** Potential type drift and noisy refactors in components/tests if aliases were changed inconsistently.  
**Resolution:** Standardized on `output<typeof Schema>` aliases and validated fixture compatibility via `tests/unit/schemas-hcm.test.ts`.

---

## [Phase 3] Next.js root layout server/client boundary for React Query providers — RESOLVED

**Encountered:** While wiring `QueryClientProvider` and devtools into app layout.  
**Root cause:** `QueryClientProvider` requires a Client Component, but root layout should remain a Server Component for SSR conventions.  
**Impact:** Could have forced unnecessary clientification of `src/app/layout.tsx` and reduced SSR clarity.  
**Resolution:** Added `src/app/providers.tsx` as a dedicated Client Component wrapper and kept `src/app/layout.tsx` as server-side shell that composes `<Providers>`.

---

## [Phase 3] Query defaults needed per-domain tuning without over-fetching — RESOLVED

**Encountered:** Implementing polling/stale-time defaults in `src/lib/query-client.ts`.  
**Root cause:** Different resources require different freshness windows; global defaults were too blunt and risked extra churn in background tabs.  
**Impact:** Either stale UI (if too slow) or excessive network/polling load (if too aggressive).  
**Resolution:** Added key-scoped presets (`balance`, `batchBalances`, `requests`, `pending`) plus `refetchIntervalInBackground: false` and env-driven reconcile interval parsing.

---

## [Phase 4] Plan-mode/tooling interruption blocked initial non-markdown edits — RESOLVED

**Encountered:** At the start of Phase 4 implementation attempts.  
**Root cause:** Session was still in plan mode; writes to TS files were rejected by tooling constraints.  
**Impact:** Initial MSW file creation failed and delayed implementation.  
**Resolution:** Switched execution mode before code edits, then proceeded with implementation in agent mode.

---

## [Phase 4] MSW v2 `HttpResponse` generic typing friction in handlers — RESOLVED

**Encountered:** `npm run typecheck` after implementing `src/mocks/hcm/handlers.ts`.  
**Root cause:** Helper functions returned `HttpResponse` without generic parameters; `HttpResponse.json` expects `JsonBodyType` and stricter signatures in MSW v2.  
**Impact:** Typecheck failed on preflight helper and JSON response wrappers.  
**Resolution:** Updated helper return types to `Response | null` where appropriate and cast validated payloads to `JsonBodyType` in a single response helper.

---

## [Phase 4] Stateful seed/reset correctness for multi-employee mock data — RESOLVED

**Encountered:** During `src/mocks/hcm/state.ts` authoring (year reset and seeded balances/requests).  
**Root cause:** The mock needed to combine fixture-driven data (`src/mocks/data.ts`) with additional manager/pending entities and deterministic reset semantics.  
**Impact:** Incorrect reset/year-start behavior would make tests flaky and scenario behavior inconsistent.  
**Resolution:** Centralized seeding in `buildSeedState()`, added `resetMockState()` + scenario flag reset coupling, and validated with dedicated tests (`state-reset`, `clock`, `scenarios`, `idempotency`).

---

## [Phase 4] Browser worker vs Node server confusion for dev/test execution — RESOLVED

**Encountered:** While wiring MSW across app runtime, Vitest, and Storybook.  
**Root cause:** MSW has two execution targets (`msw/browser` worker vs `msw/node` setupServer), and both are required in this architecture.  
**Impact:** Risk of running wrong intercept layer in tests or expecting a second standalone dev server process.  
**Resolution:** Split entry points (`src/mocks/browser.ts`, `src/mocks/server.ts`), started browser worker only when `NEXT_PUBLIC_USE_MSW=true`, and wired Vitest lifecycle in `tests/setup.ts`.
