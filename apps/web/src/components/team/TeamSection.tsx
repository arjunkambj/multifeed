"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";
import { TeamMembersContent } from "@/components/team/TeamMembersContent";
import { hexclaveClientApp } from "@/hexclave/client";

export function TeamSection() {
  const user = hexclaveClientApp.useUser({ or: "redirect" });
  const team = user.selectedTeam;
  const router = useRouter();

  useEffect(() => {
    if (!team) {
      router.replace("/created-org");
    }
  }, [router, team]);

  if (!team) {
    return <DashboardLoadingSkeleton variant="teams" />;
  }

  return <TeamMembersContent team={team} user={user} />;
}
