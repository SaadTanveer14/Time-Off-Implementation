"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { authGate as copy } from "@/copy";

export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (!auth.employeeId?.trim() || !auth.managerId?.trim()) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-lg font-semibold text-[#0F0B1E]">{copy.invalidTitle}</p>
        <p className="max-w-md text-sm text-zinc-600">{copy.invalidBody}</p>
      </div>
    );
  }
  return <>{children}</>;
}
