"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { brand, nav } from "@/copy";

interface TopBarProps {
  variant: "employee" | "manager";
  userName: string;
  userInitials: string;
  userRole?: string;
  pendingCount?: number;
}

export function TopBar({
  variant,
  userName,
  userInitials,
  userRole,
  pendingCount = 0,
}: TopBarProps) {
  const isManager = variant === "manager";

  return (
    <header
      className={cn(
        "w-full",
        isManager
          ? "bg-gradient-to-r from-[#0F0B1E] to-[#2D1B4E]"
          : "bg-white border-b border-zinc-200",
      )}
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-20 h-[72px] flex items-center justify-between">
        {/* Logo cluster */}
        <div className="flex items-center gap-3">
          <div className="h-5 w-8 rounded bg-violet-600" aria-hidden />
          <span
            className={cn(
              "text-base font-bold",
              isManager ? "text-white" : "text-[#0F0B1E]",
            )}
          >
            {brand.productName}
          </span>
          <span
            className={cn(
              "text-sm font-medium hidden sm:block",
              isManager ? "text-violet-300" : "text-zinc-500",
            )}
          >
            · {isManager ? brand.moduleManagerConsole : brand.moduleTimeOff}
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {isManager ? (
            <>
              <NavLink href="/time-off/manager" active>
                {nav.approvals(pendingCount)}
              </NavLink>
              <NavLink href="#" variant="manager">
                {nav.team}
              </NavLink>
              <NavLink href="#" variant="manager">
                {nav.reports}
              </NavLink>
              <NavLink href="/time-off" variant="manager">
                {nav.switchToEmployee}
              </NavLink>
            </>
          ) : (
            <>
              <NavLink href="/time-off" active>
                {nav.timeOff}
              </NavLink>
              <NavLink href="#">{nav.calendar}</NavLink>
              <NavLink href="#">{nav.profile}</NavLink>
              <NavLink href="/time-off/manager">{nav.switchToManager}</NavLink>
              <NavLink href="/time-off/states">{nav.statesReference}</NavLink>
            </>
          )}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold",
              isManager
                ? "bg-amber-500 text-white"
                : "bg-violet-100 text-violet-700",
            )}
          >
            {userInitials}
          </div>
          <div className="hidden lg:block">
            <div
              className={cn(
                "text-sm font-semibold leading-tight",
                isManager ? "text-white" : "text-[#0F0B1E]",
              )}
            >
              {userName}
            </div>
            {userRole && (
              <div
                className={cn(
                  "text-xs",
                  isManager ? "text-violet-300" : "text-zinc-500",
                )}
              >
                {userRole}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
  active,
  variant = "employee",
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  variant?: "employee" | "manager";
}) {
  const isManager = variant === "manager";
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
        active
          ? "bg-violet-600 text-white"
          : isManager
            ? "text-zinc-200 hover:text-white hover:bg-white/10"
            : "text-zinc-600 hover:text-[#0F0B1E] hover:bg-zinc-100",
      )}
    >
      {children}
    </Link>
  );
}
