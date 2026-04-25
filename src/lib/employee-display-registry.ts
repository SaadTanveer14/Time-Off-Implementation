/**
 * Display metadata for known demo employees (manager queue enrichment).
 * Wire requests do not carry avatar/role; map from employeeId here.
 */
export type EmployeeDisplay = {
  name: string;
  avatarColor: string;
  role: string;
};

export const employeeDisplayById: Record<string, EmployeeDisplay> = {
  emp_alex: {
    name: "Alex Rivera",
    avatarColor: "#EDE9FE",
    role: "Senior Engineer · New York HQ",
  },
  emp_jordan: {
    name: "Jordan Lee",
    avatarColor: "#FEF3C7",
    role: "Software Engineer · Remote",
  },
  emp_sam: {
    name: "Sam Chen",
    avatarColor: "#DBEAFE",
    role: "Designer · San Francisco",
  },
  emp_priya: {
    name: "Priya Kumar",
    avatarColor: "#EDE9FE",
    role: "Senior Engineer · New York HQ",
  },
};

export function getEmployeeDisplay(employeeId: string): EmployeeDisplay {
  return (
    employeeDisplayById[employeeId] ?? {
      name: employeeId,
      avatarColor: "#E4E4E7",
      role: "Employee",
    }
  );
}
