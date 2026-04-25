# UX State Matrix

> Canonical catalog of every UX state in the Time-Off module. Every row is a Storybook story, an interaction test, and (where visual) a Chromatic snapshot. This document is the single source of truth for what states exist. Removing a row requires a TRD revision.

**Companion documents:** `TRD.md §13`, `docs/TESTING_STRATEGY.md §3.3`, `docs/ARCHITECTURE.md §2`.

---

## 1. How To Read This Document

Each component has a **State Table**. Columns:

| Column | Meaning |
|---|---|
| State ID | Stable identifier (used as Storybook story name) |
| Name | Human label for reviewers |
| Trigger | What input produces this state |
| Visual treatment | What the user sees |
| Copy | User-facing strings (from `src/copy.ts`) |
| Motion | Animation tokens applied |
| A11y contract | ARIA, focus, live-region behavior |
| Story | Storybook story filename + export |
| MSW scenario | Which scenario drives it |

**Design principles applied everywhere:**

- Honest over flashy; color is never the sole signal; motion has meaning; reduced-motion collapses animation; every async state has a live-region announcement; every interactive element has a visible accessible name.

**Motion tokens (from `tailwind.config.ts`):**

| Token | Value |
|---|---|
| `motion.fast` | 150ms |
| `motion.base` | 200ms |
| `motion.slow` | 300ms |
| `motion.pulse` | 1500ms loop |
| `motion.easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `motion.easing.exit` | `cubic-bezier(0.4, 0, 1, 1)` |

---

## 2. `<BalanceCard>` States

| State ID | Name | Trigger | Visual | Copy | Motion | A11y | Story | MSW scenario |
|---|---|---|---|---|---|---|---|---|
| `Loading` | Initial load | `useQuery` pending, no cached data | Skeleton pill, dimmed card | — | skeleton crossfade 150ms | `aria-busy="true"`; `role="status"`; "Loading balance" SR text | `BalanceCard.stories.tsx#Loading` | `happyPath.delayed(800ms)` |
| `LoadedFresh` | Loaded, fresh | Query resolved within last 60s | Solid number; no indicator | `"{n} days available"`, `"synced just now"` | 200ms ease-out on first paint | `aria-live="polite"` on numeric | `...#LoadedFresh` | `happyPath` |
| `LoadedStale` | Loaded, stale | `dataUpdatedAt` >60s ago | Number + "synced 2m ago" chip | `"synced 2m ago"` | — | SR: "Balance last synced 2 minutes ago" | `...#LoadedStale` | `happyPath.delayed(0)` + fake timer +2min |
| `OptimisticPending` | Optimistic pending | Matching mutation in flight | Updated number + pulsing dot + "pending" pill | `"Updating…"` | `motion.pulse` loop on dot | `aria-live="polite"` announces "Pending sync" | `...#OptimisticPending` | `happyPath.delayed(3000ms)` |
| `OptimisticConfirmed` | Optimistic confirmed | Mutation success | Number settles to confirmed; pill fades | `"synced just now"` | pill 150ms exit | SR: "Balance updated to 8 days" | `...#OptimisticConfirmed` | `happyPath` |
| `OptimisticRolledBack` | Rolled back | Mutation error (insufficient, invalid) | Number animates back; inline banner; focus moves | `"HCM rejected: insufficient balance. Your available days are now {n}, not {m}."` | 250ms ease-in-out reverse | `role="alert"`; focus → banner | `...#OptimisticRolledBack` | `rejectInsufficientAt(...)` |
| `SilentlyWrongCorrected` | Silent-failure correction | Verification read detected drift | Number corrects; soft info toast | `"A sync adjustment was applied. HCM reports {n}."` | number fade 200ms | `role="status"`; toast SR text | `...#SilentlyWrongCorrected` | `silentFailRate(1.0)` one-shot |
| `AnniversaryBonusApplied` | Anniversary bonus | Reconciliation detected +1 on anniversary | Number increments with spark; info toast | `"Happy work anniversary — +1 day applied to your balance."` | +1 spark 300ms | `role="status"` | `...#AnniversaryBonusApplied` | `anniversaryTickAt(0)` |
| `YearStartRefresh` | Year-start accrual refresh | Reconciliation detected January-1 reset | Number updates; banner (global) | `"New policy period — your balance has been refreshed."` | 300ms | `role="status"` at app level | `...#YearStartRefresh` | `yearStartAt(0)` |
| `Error` | Load error | Query errored | Error chip; retry button | `"Couldn't load this balance. Retry?"` | 150ms | `role="alert"`; retry is button | `...#Error` | `offline` |
| `PartialFailure` | Part of list failed | Sibling card error | This card shows error; siblings OK | — | — | — | `...#PartialFailure` | `partialFail({ fail: [locB] })` |
| `ReducedMotion` | Reduced-motion preference | `prefers-reduced-motion: reduce` | Same content, instant transitions | — | all motion 0ms | — | `...#ReducedMotion` | `happyPath` + media query shim |

---

## 3. `<RequestComposer>` States

| State ID | Name | Trigger | Visual | Copy | Motion | A11y | Story | MSW scenario |
|---|---|---|---|---|---|---|---|---|
| `EmptyDraft` | Empty draft | No fields filled | Form rendered; submit disabled | `"Request time off"` header | — | labels, required indicators | `RequestComposer.stories.tsx#EmptyDraft` | `happyPath` |
| `PartiallyFilled` | Partial draft | Some fields filled, not all required | Submit disabled; field-level hints | `"Choose an end date"` | — | `aria-describedby` for hints | `...#PartiallyFilled` | `happyPath` |
| `ValidSubmittable` | Valid | All fields valid, balance sufficient | Submit enabled; positive chip | `"{n} days — available"` | — | `aria-invalid=false` | `...#ValidSubmittable` | `happyPath` |
| `InvalidInsufficientBalance` | Insufficient balance | Days > available | Submit disabled; inline warning | `"You have {m} days — not enough for {n}."` | — | `aria-invalid=true` on days field | `...#InvalidInsufficientBalance` | `happyPath` (balance=3, request=5) |
| `InvalidDateRange` | Invalid date range | End before start | Submit disabled; inline error | `"End date must be after start date."` | — | `aria-invalid=true` | `...#InvalidDateRange` | — |
| `Submitting` | Submitting | Mutation in flight | Submit disabled; spinner in button | `"Submitting…"` | button spinner rotation | `aria-busy=true` on button | `...#Submitting` | `happyPath.delayed(2000)` |
| `SubmittedSuccess` | Submitted | Mutation succeeded | Form collapses; success toast | `"Submitted — pending manager approval. Balance now {n} days."` | form exit 150ms | focus → history section; `role="status"` toast | `...#SubmittedSuccess` | `happyPath` |
| `SubmittedRejected` | Rejected | Mutation errored | Form remains; inline banner with reason; draft retained | `"HCM rejected your request: {reason}. Adjust and retry."` | banner enter 200ms | `role="alert"`; focus → banner | `...#SubmittedRejected` | `rejectInsufficientAt(...)` |
| `NetworkFailure` | Network offline | Mutation failed with network error | Banner with Retry | `"Couldn't reach HCM. Your request wasn't sent. Retry?"` | — | `role="alert"` | `...#NetworkFailure` | `offline` |
| `CircuitBreakerOpen` | Circuit open | Breaker open before submit | Submit disabled; global banner explains | `"HCM is having trouble — try again in a moment."` | — | `role="status"` | `...#CircuitBreakerOpen` | `circuitOpen` |

---

## 4. `<LiveBalanceValidator>` States

| State ID | Name | Trigger | Visual | Copy |
|---|---|---|---|---|
| `Idle` | Nothing typed | — | Neutral hint | `"Enter dates to see availability"` |
| `Sufficient` | Days ≤ available | — | Green chip | `"{n} days — you have {m} available"` |
| `Insufficient` | Days > available | — | Red chip | `"{n} days exceeds your {m} available"` |
| `BalanceRefreshedWhileTyping` | Balance changed during compose | Reconciliation updated underlying balance | Chip updates without reset | `"Balance updated to {m} days"` |

All `role="status"`, `aria-live="polite"`.

---

## 5. `<RequestRow>` States (history)

| State ID | Name | Visual | Copy |
|---|---|---|---|
| `PendingApproval` | Pending | Amber chip | `"Pending approval since {when}"` |
| `Approved` | Approved | Green chip | `"Approved by {manager} on {when}"` |
| `Denied` | Denied | Red chip + hover reason | `"Denied: {reason}"` |
| `Cancelled` | Cancelled | Gray chip | `"Cancelled on {when}"` |
| `CancelUndoWindow` | Mid-cancel | Strike-through with countdown | `"Cancelling in {s}s — Undo"` |
| `OptimisticCreating` | Just submitted, pending HCM | Dashed outline, pulse | `"Sending to HCM…"` |

---

## 6. `<ApprovalCard>` States (Manager)

| State ID | Name | Trigger | Visual | Copy | Motion | A11y |
|---|---|---|---|---|---|---|
| `LoadedFreshBalance` | Fresh balance | `dataUpdatedAt` <10s | Green "just synced" dot | `"Balance: {n} days — just synced"` | — | SR announces freshness |
| `LoadedStaleBalance` | Stale balance | `dataUpdatedAt` >30s | Amber dot; auto-refetch spinner | `"Balance: {n} days — refreshing…"` | spinner rotate | `aria-busy=true` on balance |
| `Approving` | Approving (pessimistic) | Mutation in flight | Button spinner; disable | `"Approving…"` | spinner | `aria-busy=true` |
| `Approved` | Approved | Success | Card fades; confirmation toast | `"Request approved."` | card exit 150ms | toast `role="status"` |
| `ApprovalConflict` | Conflict detected | Pre-flight balance < requested | Modal opens | `"Balance has changed since you opened this: now {n}, requested {m}."` | modal enter 180ms | focus trap in modal |
| `Denying` | Denying | Deny mutation in flight | Spinner | `"Denying…"` | — | `aria-busy=true` |
| `Denied` | Denied | Success | Card fades | `"Request denied."` | — | — |
| `Error` | Load or mutation error | Error state | Error chip; retry | `"Something went wrong — retry?"` | — | `role="alert"` |
| `AnotherManagerApprovedFirst` | 409 from HCM | Race with another manager | Toast + remove | `"Already approved by {manager}."` | — | `role="status"` |

---

## 7. `<ConflictResolutionModal>` States

| State ID | Name | Visual | Copy |
|---|---|---|---|
| `BalanceLowered` | Balance dropped | Modal with side-by-side values | `"Balance was {a}, is now {b}. Approve would overdraw. Deny or cancel?"` |
| `BalanceRaised` | Balance increased | Modal affirming | `"Balance is higher than when you opened this. Safe to approve."` |
| `RequestCancelledByEmployee` | Employee cancelled | Info modal | `"Employee cancelled this request while you were viewing."` |

All modals trap focus, close on Esc, restore focus to the triggering element.

---

## 8. `<GlobalBanner>` States

| State ID | Name | Trigger | Visual | Copy |
|---|---|---|---|---|
| `Hidden` | No banner | Normal operation | Nothing | — |
| `Offline` | Network offline | `navigator.onLine === false` | Yellow banner | `"You're offline. Changes will not save until you reconnect."` |
| `CircuitBreakerOpen` | HCM degraded | Circuit breaker open | Orange banner | `"HCM is having trouble. Some features are temporarily disabled."` |
| `YearStartPolicyRefresh` | Annual reset | Reconciliation detected year-start | Blue banner | `"New policy period — balances have been refreshed."` |
| `HCMMaintenance` | Explicit maintenance signal | HCM 503 with specific header | Blue banner | `"HCM is undergoing maintenance. Requests will resume shortly."` |

---

## 9. `<NotificationLayer>` (toast) States

| State ID | Kind | Copy template | Auto-dismiss |
|---|---|---|---|
| `Success` | success | `"Submitted — pending approval."` | 4s |
| `Info` | info | `"Balance refreshed."` | 5s |
| `Warning` | warning | `"HCM returned a sync correction."` | 6s |
| `Error` | error | `"Request rejected: {reason}."` | Sticky until dismissed |

---

## 10. Page-level Scenarios

These exercise cross-cutting states only reproducible at route level.

| State ID | Page | Description | Story |
|---|---|---|---|
| `EmployeeFirstVisit` | `/time-off` | No history, with balances | `EmployeeView.stories.tsx#FirstVisit` |
| `EmployeeWithMixedHistory` | `/time-off` | Mix of pending, approved, denied | `...#MixedHistory` |
| `ManagerEmptyQueue` | `/time-off/approvals` | No pending requests | `ManagerView.stories.tsx#EmptyQueue` |
| `ManagerBusyQueue` | `/time-off/approvals` | 15+ pending requests | `...#BusyQueue` |
| `FullReducedMotion` | both | `prefers-reduced-motion` on | shared decorator |
| `FullOffline` | both | MSW `offline` scenario | shared decorator |
| `ConcurrentBackgroundAnniversary` | `/time-off` | User composing a request, anniversary fires | `...#ComposeWithAnniversary` |

---

## 11. Story coverage enforcement

`scripts/check-story-coverage.ts` parses this document, extracts the list of required story IDs (of the form `ComponentName.stories.tsx#StateID`), and verifies each exists as an exported story. Missing stories fail the build. Addition of a new row here requires a corresponding story in the same PR.

---

## 12. Visual treatments — palette tokens

| Token | Hex | Usage |
|---|---|---|
| `neutral-900` | `#0B0F14` | Primary text |
| `neutral-500` | `#6B7280` | Secondary text, timestamps |
| `neutral-100` | `#F3F4F6` | Skeleton, subtle fill |
| `positive-600` | `#047857` | Success, confirmed balance |
| `warning-500` | `#D97706` | Stale, warning copy |
| `danger-600` | `#B91C1C` | Errors, rollback banner |
| `info-600` | `#1D4ED8` | Info banners |
| `accent-500` | `#6D28D9` | Pending / optimistic indicators |

All tokens pass WCAG AA contrast on white and on neutral-900.

---

*This is the canonical list. Reviewers: if you can think of a state not represented here, it is a gap — please open an issue or PR against this document.*
