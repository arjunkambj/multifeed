import { Suspense } from "react";
import { OverviewDashboard } from "@/components/overview/OverviewDashboard";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";

export default function OverviewPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="overview" />}>
      <OverviewDashboard />
    </Suspense>
  );
}
