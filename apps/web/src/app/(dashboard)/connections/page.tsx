import { Suspense } from "react";
import { preloadQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { ConnectionsPage } from "@/components/connections/ConnectionsPage";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";
import { requireDashboardSession } from "@/hexclave/dashboard-session";
import { currentTimeBucket } from "@/lib/time-bucket";

async function ConnectionsContent() {
  const { convexToken } = await requireDashboardSession();
  const preloaded = await preloadQuery(
    api.oauth.accounts.getConnectionsPageData,
    { nowMs: currentTimeBucket() },
    { token: convexToken },
  );

  return <ConnectionsPage preloaded={preloaded} />;
}

export default function Page() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="connections" />}>
      <ConnectionsContent />
    </Suspense>
  );
}
