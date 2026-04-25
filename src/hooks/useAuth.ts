"use client";

import { createContext, createElement, useContext } from "react";
import { currentEmployee, currentManager } from "@/mocks/data";
import { DEMO_EMPLOYEE_ID, DEMO_MANAGER_ID } from "@/lib/demo-ids";
import type { LocationId } from "@/lib/types";

export type AuthContextValue = {
  employeeId: string;
  managerId: string;
  roles: string[];
  employeeName: string;
  employeeInitials: string;
  employeeRole: string;
  employeeAvatarColor: string;
  employeePrimaryLocationId: LocationId;
  managerName: string;
  managerInitials: string;
  managerRole: string;
  managerAvatarColor: string;
};

const defaultAuth: AuthContextValue = {
  employeeId: DEMO_EMPLOYEE_ID,
  managerId: DEMO_MANAGER_ID,
  roles: ["employee", "manager"],
  employeeName: currentEmployee.name,
  employeeInitials: currentEmployee.initials,
  employeeRole: currentEmployee.role,
  employeeAvatarColor: currentEmployee.avatarColor,
  employeePrimaryLocationId: currentEmployee.primaryLocationId,
  managerName: currentManager.name,
  managerInitials: currentManager.initials,
  managerRole: currentManager.role,
  managerAvatarColor: currentManager.avatarColor,
};

const AuthContext = createContext<AuthContextValue>(defaultAuth);

export function MockAuthProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value?: Partial<AuthContextValue>;
}) {
  return createElement(AuthContext.Provider, { value: { ...defaultAuth, ...value } }, children);
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
