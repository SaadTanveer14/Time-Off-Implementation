import { TopBar } from "@/components/shared/TopBar";
import { BalanceCard } from "@/components/employee/BalanceCard";
import { currentEmployee } from "@/mocks/data";
import type { Balance, BalanceCardState } from "@/lib/types";

const now = Date.now();

const sampleStates: { state: BalanceCardState; balance: Balance; caption: string }[] =
  [
    {
      state: "loading",
      balance: makeBalance("loading", { days: 0, locationName: "Loading…" }),
      caption: "Loading — under 400ms shimmer",
    },
    {
      state: "loaded-fresh",
      balance: makeBalance("loaded-fresh", {
        days: 10,
        locationName: "New York HQ",
        isPrimary: true,
        accrualPerMonth: 1.5,
      }),
      caption: "Loaded · Fresh — hero presentation",
    },
    {
      state: "loaded-stale",
      balance: makeBalance("loaded-stale", {
        days: 8,
        locationName: "San Francisco",
        syncedAt: now - 8 * 60_000,
        accrualPerMonth: 1,
      }),
      caption: "Loaded · Stale — refreshing in background",
    },
    {
      state: "optimistic-pending",
      balance: makeBalance("optimistic-pending", {
        days: 7,
        previousDays: 10,
        locationName: "New York HQ",
      }),
      caption: "Optimistic · Pending — awaiting HCM",
    },
    {
      state: "optimistic-confirmed",
      balance: makeBalance("optimistic-confirmed", {
        days: 7,
        locationName: "New York HQ",
      }),
      caption: "Optimistic · Confirmed — momentary success flash",
    },
    {
      state: "optimistic-rolled-back",
      balance: makeBalance("optimistic-rolled-back", {
        days: 10,
        locationName: "New York HQ",
      }),
      caption: "Rolled back — HCM rejected the request",
    },
    {
      state: "anniversary-bonus",
      balance: makeBalance("anniversary-bonus", {
        days: 11,
        locationName: "New York HQ",
      }),
      caption: "Anniversary bonus — +1 day applied",
    },
    {
      state: "reconciled",
      balance: makeBalance("reconciled", {
        days: 4,
        previousDays: 5,
        locationName: "Remote",
      }),
      caption: "Reconciled — silent drift corrected by background sync",
    },
    {
      state: "error",
      balance: makeBalance("error", {
        days: 10,
        locationName: "New York HQ",
        syncedAt: now - 4 * 3600_000,
      }),
      caption: "HCM unreachable — last known shown",
    },
  ];

export default function StatesPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <TopBar
        variant="employee"
        userName={currentEmployee.name}
        userInitials={currentEmployee.initials}
        userRole={currentEmployee.role}
      />

      <main className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-20 py-12">
        <header className="mb-10">
          <p className="text-[14px] font-semibold uppercase tracking-[2px] text-violet-600">
            Design system · Balance Card
          </p>
          <h1 className="mt-2 text-[40px] sm:text-[56px] font-extrabold tracking-[-1.5px] text-[#0F0B1E] leading-[1.05]">
            Every state the card can be in.
          </h1>
          <p className="mt-3 text-lg text-zinc-500">
            Nine truths, one component. The card tells you where the data
            stands — never lies, never hides.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sampleStates.map(({ state, balance, caption }) => (
            <div key={state}>
              <BalanceCard balance={balance} />
              <p className="mt-3 text-xs italic text-zinc-500">{caption}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function makeBalance(
  state: BalanceCardState,
  overrides: Partial<Balance>,
): Balance {
  return {
    locationId: "ny-hq",
    locationName: "New York HQ",
    days: 10,
    syncedAt: now,
    state,
    ...overrides,
  };
}
