import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "violet"
  | "amber"
  | "emerald"
  | "rose"
  | "sky"
  | "white-on-violet";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-zinc-100 text-zinc-600",
  violet: "bg-violet-100 text-violet-800",
  amber: "bg-amber-100 text-amber-800",
  emerald: "bg-emerald-100 text-emerald-800",
  rose: "bg-rose-100 text-rose-800",
  sky: "bg-sky-100 text-sky-800",
  "white-on-violet": "bg-white/20 text-white",
};

export function StateBadge({
  children,
  tone = "neutral",
  withDot = false,
  pulsing = false,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  withDot?: boolean;
  pulsing?: boolean;
  className?: string;
}) {
  const dotColor: Record<Tone, string> = {
    neutral: "bg-zinc-500",
    violet: "bg-violet-600",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    sky: "bg-sky-500",
    "white-on-violet": "bg-emerald-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[1.5px]",
        toneClasses[tone],
        className,
      )}
    >
      {withDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            dotColor[tone],
            pulsing && "animate-pulse",
          )}
        />
      )}
      {children}
    </span>
  );
}
