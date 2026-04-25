/**
 * Single translation surface for user-visible copy (TRD NFR-6 / Phase 2 plan).
 * Components should import from here instead of hard-coding strings.
 */

// --- Pluralization helpers ---

export function daysLabel(count: number): string {
  return `${count} day${count === 1 ? "" : "s"}`;
}

export function businessDaysLabel(count: number): string {
  return `${count} business day${count === 1 ? "" : "s"}`;
}

export function requestCountLabel(count: number): string {
  const noun = count === 1 ? "request" : "requests";
  const verb = count === 1 ? "needs" : "need";
  return `${count} ${noun} ${verb} your call.`;
}

// --- Brand / chrome ---

export const brand = {
  productName: "ExampleHR",
  moduleTimeOff: "Time Off",
  moduleManagerConsole: "Manager Console",
} as const;

// --- Top bar ---

export const nav = {
  timeOff: "Time Off",
  calendar: "Calendar",
  profile: "Profile",
  switchToManager: "Switch to Manager",
  switchToEmployee: "Switch to Employee",
  statesReference: "States Reference",
  approvals: (count: number) =>
    count > 0 ? `Approvals (${count})` : "Approvals",
  team: "Team",
  reports: "Reports",
} as const;

// --- Employee view ---

export const employee = {
  pageEyebrow: (firstName: string) => `Hi, ${firstName}`,
  pageTitle: "Your time off, at a glance.",
  undoToastMessage: "Request cancelled",
  anniversaryLocationFallback: "New York HQ",
} as const;

// --- Balance card ---

export const balanceCard = {
  syncedJustNow: "Synced · just now",
  synced: "Synced",
  staleRefreshing: (relative: string) => `${relative} · refreshing`,
  optimisticPending: "Optimistic · pending",
  rolledBack: "Rolled back",
  confirmed: "Confirmed",
  daysSuffix: "days",
  wasPrevious: (n: number) => `was ${n}`,
  rollbackChip: "Insufficient balance · your draft is restored",
  awaitingHcm: "Awaiting HCM confirmation",
  accrualPerMonth: (n: number) =>
    `+ ${n} day${n === 1 ? "" : "s"} / month`,
  loadingShimmerNote: "Shimmer · under 400ms",
  hcmUnreachable: "HCM unreachable",
  lastKnown: (n: number) => `last known: ${n} days`,
  retry: "Retry",
  anniversaryBadge: "Anniversary bonus",
  anniversaryLine: "+1 day added on your work-iversary 🎉",
  reconciledBadge: "Reconciled",
  reconciledFooter: "Reconciled with HCM · background sync",
} as const;

// --- Request composer ---

export const composer = {
  sectionEyebrow: "New request",
  sectionTitle: "Plan your time off.",
  sectionSubtitle: "Three quick fields. The validator stays live.",
  fieldLocation: "Location",
  fieldFrom: "From",
  fieldTo: "To",
  fieldNote: "Note (optional)",
  notePlaceholder: "A short explanation for your manager…",
  pickDateRange: "Pick a date range",
  sufficientChip: (left: number) => `Balance is sufficient · ${left} left`,
  shortBy: (n: number) =>
    `Short by ${n} day${n === 1 ? "" : "s"}`,
  locationAvailSuffix: "avail.",
  submit: "Submit request",
  submitArrow: "→",
} as const;

// --- Request history ---

export const history = {
  eyebrow: "Your requests",
  title: "History.",
  totalBadge: (n: number) => `${n} total`,
  empty: "No requests yet. The composer is on the left.",
  cancel: "Cancel",
  statusSubmitting: "Submitting",
  statusPending: "Pending",
  statusApproved: "Approved",
  statusDenied: "Denied",
  statusCancelled: "Cancelled",
} as const;

// --- Anniversary / undo toasts ---

export const toast = {
  anniversaryEyebrow: "Anniversary bonus",
  anniversaryBody: (daysAdded: number, locationName: string) =>
    `+${daysAdded} day added to ${locationName}`,
  dismissAria: "Dismiss",
  undoButton: (seconds: number) => `Undo · ${seconds}s`,
} as const;

// --- Manager view ---

export const manager = {
  pageEyebrow: "Manager · Approvals",
  allCaughtUp: "All caught up.",
  subtitle:
    "Each action commits to HCM. The balance you see is read fresh just for you.",
  filterPending: "Pending",
  filterApproved: "Approved",
  filterDenied: "Denied",
  sortBy: "Sort by",
  sortSubmitted: "Submitted ↓",
  emptyQueueTitle: "The queue is clear.",
  emptyQueueBody:
    "Nothing waiting on you. We'll notify you when a new request arrives.",
  decidedEmptyTitle: (outcome: "approved" | "denied") =>
    `No ${outcome} requests yet`,
  decidedEmptyBody: "Decisions you've made will show up here.",
  footerNote:
    "Manager actions are pessimistic by design. See ADR-004 · Optimism-to-Reversibility.",
  /** Demo-only narrative until conflict flow is store-driven (Phase 9). */
  demoChangeDetail:
    "Maya K. approved Jordan L.'s Apr 29 request (1 day) · 2 min ago",
} as const;

// --- Approval card ---

export const approvalCard = {
  oldestInQueue: "Pending · Oldest in queue",
  submittedPrefix: "· submitted",
  reportsToYou: "Reports to you",
  requestedDatesEyebrow: "Requested dates",
  employeeNoteEyebrow: "Employee note",
  freshBalanceEyebrow: "Fresh balance · read",
  freshBalanceSummary: (
    daysAvailable: number,
    willHave: number,
    sufficient: boolean,
  ) =>
    `${daysAvailable} days available → ${willHave} after approval ${
      sufficient ? "✓ Sufficient" : "⚠ Would overdraw"
    }`,
  deny: "Deny",
  approve: "Approve · commit",
  committing: "Committing to HCM…",
  approveHint: "Approve commits to HCM immediately. No undo.",
} as const;

// --- Queue sidebar ---

export const queueSidebar = {
  title: "Next in queue",
  balanceLiveTitle: "Balance check is live",
  balanceLiveBody: "Each card re-reads HCM when you focus it.",
  availShort: (d: number) => `${d}d avail · short`,
  availOk: (d: number) => `${d}d avail.`,
} as const;

// --- Conflict modal ---

export const conflictModal = {
  eyebrow: "Balance changed",
  title: "Approve with current numbers?",
  bodyIntro: (employeeFirstName: string) =>
    `${employeeFirstName}'s balance just updated in HCM — another request was approved while this page was open. Please review the new numbers before committing.`,
  wasLabel: "Was (2 min ago)",
  employeeWouldHave: "Employee would have had",
  daysAfterApproval: (n: number) => `${n} days after approval`,
  nowLabel: "Now (live)",
  requestAsksFor: "Request asks for",
  daysArrowLeft: (requested: number, left: number) =>
    `${requested} days → ${left} left`,
  changeDetailEyebrow: "Change detail",
  stillSafeBody: (employeeFirstName: string) =>
    `Balance still covers the request — approval is safe to proceed, but ${employeeFirstName} will have fewer days remaining.`,
  keepPending: "Keep pending",
  denyInstead: "Deny instead",
  approveWithNewBalance: "Approve with new balance",
} as const;

// --- States reference page (design QA) ---

export const statesPage = {
  eyebrow: "Design system · Balance Card",
  title: "Every state the card can be in.",
  subtitle:
    "Nine truths, one component. The card tells you where the data stands — never lies, never hides.",
  captions: {
    loading: "Loading — under 400ms shimmer",
    loadedFresh: "Loaded · Fresh — hero presentation",
    loadedStale: "Loaded · Stale — refreshing in background",
    optimisticPending: "Optimistic · Pending — awaiting HCM",
    optimisticConfirmed: "Optimistic · Confirmed — momentary success flash",
    optimisticRolledBack: "Rolled back — HCM rejected the request",
    anniversaryBonus: "Anniversary bonus — +1 day applied",
    reconciled: "Reconciled — silent drift corrected by background sync",
    error: "HCM unreachable — last known shown",
  } as const,
} as const;
