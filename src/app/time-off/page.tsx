import { dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchEmployeeTimeOff } from "@/lib/prefetch-queries";
import { DEMO_EMPLOYEE_ID } from "@/lib/demo-ids";
import { EmployeeView } from "@/components/employee/EmployeeView";
import { QueryHydrationBoundary } from "@/components/shared/QueryHydrationBoundary";

export default async function TimeOffPage() {
  const queryClient = getQueryClient();
  await prefetchEmployeeTimeOff(queryClient, DEMO_EMPLOYEE_ID);
  return (
    <QueryHydrationBoundary state={dehydrate(queryClient)}>
      <EmployeeView />
    </QueryHydrationBoundary>
  );
}
