# Time-Off Implementation

Production-style Time-Off module built with Next.js, TanStack Query, Zustand, Zod, MSW, Storybook, Vitest, and Playwright.

### Live Deployments

- Storybook: [https://storybook-weld-six.vercel.app/](https://storybook-weld-six.vercel.app/)
- Web App: [https://time-off-implementation.vercel.app/](https://time-off-implementation.vercel.app/)

This README documents:
- how to run the project locally
- how to run each testing layer
- how to run and verify Storybook stories (including `play` functions)
- how to build the app and Storybook
- what has been verified in this implementation

## Tech Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- TanStack Query (server state) + Zustand (client state)
- Zod (runtime validation + type source of truth)
- MSW (mock HCM service for dev/tests/stories)
- Vitest + Testing Library (unit/component/integration/contract)
- Storybook 8 + a11y/interactions addons
- Playwright (E2E)
- GitHub Actions CI pipeline

## Prerequisites

- Node.js 20+ (CI uses Node 20)
- npm (project package manager)
- macOS/Linux/Windows supported (Playwright installs Chromium)

## Project Setup

From the project root (`Time-Off-Implementation`):

```bash
npm install
```

`postinstall` automatically runs:

```bash
playwright install chromium
```

So the browser needed for E2E is installed during dependency setup.

## One-Step Run (App + Storybook)

If you just want to run this quickly with the current repo setup:

- App (single command):
  ```bash
  npm install && npm run dev
  ```
- Storybook (single command):
  ```bash
  npm install && npm run storybook
  ```

This works because environment values are already present in this codebase for convenience.

## Environment Variables

Create `.env.local` (or copy from `.env.example`) with:

```bash
NEXT_PUBLIC_USE_MSW=true
NEXT_PUBLIC_RECONCILE_INTERVAL_MS=60000
NEXT_PUBLIC_HCM_BASE_URL=/api/hcm
```

Notes:
- `NEXT_PUBLIC_USE_MSW=true` runs with the in-app mock HCM layer (recommended for local dev and Storybook).
- `NEXT_PUBLIC_RECONCILE_INTERVAL_MS` controls reconciliation polling cadence.
- `NEXT_PUBLIC_HCM_BASE_URL` is the base URL used by the HCM client.

Important security note:
- For this demo/review workflow, environment values have been pushed into the codebase so runners can start in one step.
- This is intentionally convenient for evaluation, but it is not a production-safe practice.
- In real environments, never commit environment values; use secure secret management and deployment-time injection.

## Run The App

Start dev server:

```bash
npm run dev
```

Open:
- Employee view: `http://localhost:3000/time-off`
- Manager view: `http://localhost:3000/time-off/manager`

Production run:

```bash
npm run build
npm run start
```

## Storybook

### Run Storybook

```bash
npm run storybook
```

Default URL: `http://localhost:6006`

### Build Storybook

```bash
npm run build-storybook
```

Build output directory: `storybook-static/`

### Verify Story Coverage Against UX Matrix

This project enforces that required states in `plan/UX_STATE_MATRIX.md` are backed by story exports.

```bash
npm run check-story-coverage
```

This checks references like `Component.stories.tsx#StateExport` and fails if:
- the story file is missing, or
- the referenced export is missing.

### Story Files Included

- `stories/BalanceCard.stories.tsx`
- `stories/RequestComposer.stories.tsx`
- `stories/EmployeeView.stories.tsx`
- `stories/ManagerView.stories.tsx`
- `stories/ComponentName.stories.tsx` (coverage placeholder)

### How `play` Functions Are Exercised

- Each story includes a `play` function for interaction-level assertions.
- In Storybook UI, `play` functions run when the story renders (Interactions panel).
- In CI, story correctness is guarded by:
  - Storybook static build (`npm run build-storybook`)
  - story-to-matrix coverage check (`npm run check-story-coverage`)
  - optional Chromatic visual regression flow when token is configured.

## Testing

GitHub Actions automatically runs this test/build workflow on `push` to `main` and on pull requests, so merge readiness is continuously validated in CI.

![CI workflow run graph](/Users/muhammadsaadtanveer/.cursor/projects/Users-muhammadsaadtanveer-Documents-Claude-Projects/assets/Screenshot_2026-04-25_at_3.44.28_PM-79ae3db2-bbcf-4c15-8940-a83a3ec0a334.png)

## Quick Commands

- Unit/component/mocks suite:
  ```bash
  npm test
  ```
- Watch mode:
  ```bash
  npm run test:watch
  ```
- Coverage:
  ```bash
  npm run test:coverage
  ```
- Integration tests:
  ```bash
  npm run test:integration
  ```
- Contract tests:
  ```bash
  npm run test:contract
  ```
- E2E tests:
  ```bash
  npm run test:e2e
  ```
- Lint + typecheck:
  ```bash
  npm run lint
  npm run typecheck
  ```

## Test Layers

### 1) Unit + Component + Mock Behavior

Run:

```bash
npm test
```

Covers:
- core utilities (`query-keys`, `request-state-machine`, `circuit-breaker`, `reconciliation`, `idempotency`, `date-utils`, `observability`, etc.)
- state stores (`request-draft`, `manager-filters`, `toast-queue`, `conflict-modal`, `drift-notifications`, `circuit-breaker`)
- hooks (`useBalances`, `useRequests`, `useSubmitRequest`, `useCancelRequest`, `useApproveRequest`, `useDenyRequest`, `useReconciliationLoop`, `useAuth`)
- component behavior tests (e.g. request composer/history/top bar)
- mock state/idempotency/clock behavior

Coverage thresholds are enforced in `vitest.config.ts`:
- statements: 85%
- branches: 80%
- functions: 85%
- lines: 85%

### 2) Integration

Run:

```bash
npm run test:integration
```

Scope:
- route-level flow and cross-component interactions in `tests/integration/**`
- includes employee and manager journey integration coverage

### 3) Contract

Run:

```bash
npm run test:contract
```

Scope:
- endpoint contracts and schema validation in `tests/contract/**`
- ensures Zod-validated payload expectations hold across request/response shapes

### 4) End-to-End (Playwright)

Run:

```bash
npm run test:e2e
```

Config highlights (`playwright.config.ts`):
- single-worker deterministic execution
- Chromium desktop project
- trace retained on failure
- boots app via production server command:
  - `npm run build && npm run start`

Current E2E journeys (`tests/e2e/time-off-journeys.spec.ts`):
- employee <-> manager tab switching flow
- employee submit-request flow visibility

## Build & Analysis

- App build:
  ```bash
  npm run build
  ```
- Production start:
  ```bash
  npm run start
  ```
- Bundle analysis:
  ```bash
  npm run analyze
  ```
- Mutation testing:
  ```bash
  npm run mutation
  ```
- Chromatic (local/manual):
  ```bash
  npm run chromatic
  ```

## Verification Coverage (What Was Verified)

Verification mechanisms implemented in this repo:

- Unit/component/mocks suites via Vitest (`npm test`)
- Separate integration suite (`npm run test:integration`)
- Separate contract suite (`npm run test:contract`)
- Coverage gate with thresholds (`npm run test:coverage`)
- Storybook state coverage enforcement against `plan/UX_STATE_MATRIX.md` (`npm run check-story-coverage`)
- Storybook static build verification (`npm run build-storybook`)
- End-to-end journeys in Playwright (`npm run test:e2e`)

Recommended local “full verification” order:

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run test:contract
npm run test:coverage
npm run check-story-coverage
npm run build-storybook
npm run build
npm run test:e2e
```

If you are interested in internal sequencing and rollout detail, refer to `plan/IMPLEMENTATION_PLAN.md`.

## CI Pipeline

GitHub Actions workflow: `.github/workflows/ci.yml`

Jobs include:
- Typecheck + lint
- Unit + integration + contract tests
- Coverage artifact upload
- Storybook coverage check + Storybook build artifact
- Next.js build
- Bundle budget enforcement (First Load JS shared by all, budget 200 kB)
- Nightly/manual E2E execution
- Chromatic (when `CHROMATIC_PROJECT_TOKEN` is configured)

## Useful Day-to-Day Workflows

### Fast local dev loop

```bash
npm run dev
npm run test:watch
```

### Pre-PR sanity check

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run test:contract
npm run check-story-coverage
npm run build
```

### Release confidence check

```bash
npm run test:coverage
npm run build-storybook
npm run test:e2e
```

## Troubleshooting

- If E2E fails due to browser/runtime setup:
  - run `npx playwright install --with-deps chromium` (Linux CI style) or `npx playwright install chromium` locally.
- If stories fail coverage check:
  - ensure every required `...stories.tsx#ExportName` reference in `plan/UX_STATE_MATRIX.md` exists as an exported story.
- If app/test data looks inconsistent:
  - ensure MSW is enabled (`NEXT_PUBLIC_USE_MSW=true`) and restart the dev server.

---

If you want, the next improvement is adding an explicit `npm run verify:all` script so full verification is a single command instead of a checklist.
