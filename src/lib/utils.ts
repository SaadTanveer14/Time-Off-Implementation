import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combine class names with tailwind-aware merging. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pretty relative time: "just now", "8 min ago", "4h ago". */
export function relativeTime(epoch: number, now: number = Date.now()): string {
  const diffSec = Math.max(0, Math.floor((now - epoch) / 1000));
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

/** "May 5" / "Apr 17 → Apr 20" / "Apr 1 → Apr 2" */
export function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (start.toDateString() === end.toDateString()) return fmt(start);
  return `${fmt(start)} → ${fmt(end)}`;
}

/** Count of business days inclusive between two ISO dates. */
export function businessDays(startISO: string, endISO: string): number {
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");
  if (end < start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/** Generate a fresh ID — uses crypto when available. */
export function newId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
