"use client";

import { useMemo, useState } from "react";
import { cn, businessDays, formatDateRange } from "@/lib/utils";
import type { LocationId, TimeOffRequest } from "@/lib/types";
import { locations } from "@/mocks/data";

interface RequestComposerProps {
  /** Map of locationId -> available days */
  availableByLocation: Record<LocationId, number>;
  onSubmit: (req: {
    locationId: LocationId;
    startDate: string;
    endDate: string;
    days: number;
    note?: string;
  }) => void;
}

export function RequestComposer({
  availableByLocation,
  onSubmit,
}: RequestComposerProps) {
  const [locationId, setLocationId] = useState<LocationId>("ny-hq");
  const [startDate, setStartDate] = useState("2026-05-05");
  const [endDate, setEndDate] = useState("2026-05-08");
  const [note, setNote] = useState("");

  const days = useMemo(
    () => businessDays(startDate, endDate),
    [startDate, endDate],
  );
  const available = availableByLocation[locationId] ?? 0;
  const sufficient = days <= available && days > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sufficient) return;
    onSubmit({ locationId, startDate, endDate, days, note: note.trim() || undefined });
    setNote("");
  };

  return (
    <section className="rounded-3xl bg-white border border-zinc-200 p-8 shadow-[0_8px_16px_rgba(15,11,30,0.06)]">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-violet-600">
          New request
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0F0B1E]">
          Plan your time off.
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Three quick fields. The validator stays live.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Location */}
        <Field label="Location">
          <div className="grid grid-cols-3 gap-2">
            {locations.map((loc) => {
              const active = locationId === loc.id;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setLocationId(loc.id)}
                  className={cn(
                    "rounded-2xl border-2 px-4 py-3 text-left transition-all",
                    active
                      ? "border-violet-600 bg-violet-50"
                      : "border-zinc-200 bg-white hover:border-zinc-300",
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-semibold",
                      active ? "text-violet-900" : "text-[#0F0B1E]",
                    )}
                  >
                    {loc.shortName}
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 text-[11px] font-medium",
                      active ? "text-violet-700" : "text-zinc-500",
                    )}
                  >
                    {availableByLocation[loc.id] ?? 0} avail.
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-[#0F0B1E] focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-[#0F0B1E] focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
          </Field>
        </div>

        {/* Day count + validator */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-full bg-violet-100 px-4 py-1.5 text-xs font-bold text-violet-800">
            {days} day{days !== 1 ? "s" : ""}
          </span>
          {days === 0 ? (
            <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-600">
              Pick a date range
            </span>
          ) : sufficient ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-800">
              <CheckIcon /> Balance is sufficient · {available - days} left
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-4 py-1.5 text-xs font-semibold text-rose-800">
              <span aria-hidden>⚠</span> Short by {days - available} day{days - available !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Note */}
        <Field label="Note (optional)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A short explanation for your manager…"
            rows={2}
            className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-[#0F0B1E] placeholder:text-zinc-400 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
        </Field>

        {/* Submit */}
        <button
          type="submit"
          disabled={!sufficient}
          className={cn(
            "group relative flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold transition-all",
            sufficient
              ? "bg-gradient-to-b from-violet-600 to-violet-800 text-white hover:translate-y-[-1px] hover:shadow-lg active:translate-y-0"
              : "bg-zinc-100 text-zinc-400 cursor-not-allowed",
          )}
        >
          Submit request
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      </form>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[1.5px] text-zinc-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="2,7 6,11 12,3" />
    </svg>
  );
}
