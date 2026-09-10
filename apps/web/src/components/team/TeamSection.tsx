"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { TeamMembersContent } from "@/components/team/TeamMembersContent";
import { TeamPageSkeleton } from "@/components/team/TeamPageSkeleton";
import { hexclaveClientApp } from "@/hexclave/client";

export function TeamSection() {
  return (
    <Suspense fallback={<TeamPageSkeleton />}>
      <TeamSectionInner />
    </Suspense>
  );
}

function TeamSectionInner() {
  const user = hexclaveClientApp.useUser({ or: "redirect" });
  const team = user.selectedTeam;
  const router = useRouter();

  useEffect(() => {
    if (!team) {
      router.replace("/created-org");
    }
  }, [router, team]);

  if (!team) {
    return <TeamPageSkeleton />;
  }

  return <TeamMembersContent team={team} user={user} />;
}
