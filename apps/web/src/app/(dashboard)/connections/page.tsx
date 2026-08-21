import type { Metadata } from "next";
import { Suspense } from "react";
import { ConnectionsPage } from "@/components/connections/ConnectionsPage";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";

export const metadata: Metadata = {
  title: "Connections",
};

export default function Page() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="connections" />}>
      <ConnectionsPage />
    </Suspense>
  );
}
