"use client";

import { Suspense } from "react";
import { useUser } from "@hexclave/next";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { TeamSection } from "@/components/team/TeamSection";
import { TeamsPageSkeleton } from "@/components/team/TeamsPageSkeleton";

function TeamLayoutContent() {
  const user = useUser({ or: "redirect" });
  const team = user.selectedTeam;

  if (!team) {
    return (
      <div className="flex w-full flex-1 flex-col gap-6">
        <DashboardPageTitle
          title="Manage team"
          description="Choose a Hexclave team before managing members and invitations."
        />
      </div>
    );
  }

  return <TeamSection team={team} />;
}

export function TeamLayout() {
  return (
    <Suspense fallback={<TeamsPageSkeleton />}>
      <TeamLayoutContent />
    </Suspense>
  );
}
