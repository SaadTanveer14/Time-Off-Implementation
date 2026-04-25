import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <p className="text-[14px] font-semibold uppercase tracking-[2px] text-violet-600">
          ExampleHR · Time Off
        </p>
        <h1 className="mt-3 text-5xl sm:text-6xl font-extrabold tracking-tight text-[#0F0B1E]">
          Pick a view to test.
        </h1>
        <p className="mt-4 text-lg text-zinc-500">
          Three live surfaces. All wired to mock data — submit, cancel, approve,
          deny, and watch the conflict modal fire.
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NavCard
            href="/time-off"
            eyebrow="Employee"
            title="Dashboard"
            tone="hero"
          />
          <NavCard
            href="/time-off/manager"
            eyebrow="Manager"
            title="Approvals"
            tone="ink"
          />
          <NavCard
            href="/time-off/states"
            eyebrow="Reference"
            title="States"
            tone="light"
          />
        </div>
      </div>
    </main>
  );
}

function NavCard({
  href,
  eyebrow,
  title,
  tone,
}: {
  href: string;
  eyebrow: string;
  title: string;
  tone: "hero" | "ink" | "light";
}) {
  const cls = {
    hero:
      "bg-gradient-to-br from-violet-600 to-violet-900 text-white shadow-[0_16px_32px_rgba(124,58,237,0.35)]",
    ink: "bg-[#0F0B1E] text-white",
    light: "bg-white text-[#0F0B1E] border border-zinc-200",
  }[tone];

  return (
    <Link
      href={href}
      className={
        "group rounded-3xl p-6 text-left transition-transform hover:translate-y-[-2px] " +
        cls
      }
    >
      <p
        className={
          "text-[10px] font-bold uppercase tracking-[1.5px] " +
          (tone === "light" ? "text-violet-600" : "text-white/70")
        }
      >
        {eyebrow}
      </p>
      <p className="mt-2 text-2xl font-bold">{title}</p>
      <p
        className={
          "mt-6 text-sm font-semibold " +
          (tone === "light" ? "text-zinc-500" : "text-white/70")
        }
      >
        Open <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
      </p>
    </Link>
  );
}
