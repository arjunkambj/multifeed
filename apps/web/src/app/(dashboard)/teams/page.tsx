import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";
import { TeamSection } from "@/components/team";

export const metadata: Metadata = {
  title: "Team",
};

export default function TeamsPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="teams" />}>
      <TeamSection />
    </Suspense>
  );
}
