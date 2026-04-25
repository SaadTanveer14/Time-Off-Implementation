import { dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchManagerPending } from "@/lib/prefetch-queries";
import { DEMO_MANAGER_ID } from "@/lib/demo-ids";
import { ManagerView } from "@/components/manager/ManagerView";
import { QueryHydrationBoundary } from "@/components/shared/QueryHydrationBoundary";

export default async function ManagerPage() {
  const queryClient = getQueryClient();
  await prefetchManagerPending(queryClient, DEMO_MANAGER_ID);
  return (
    <QueryHydrationBoundary state={dehydrate(queryClient)}>
      <ManagerView />
    </QueryHydrationBoundary>
  );
}
