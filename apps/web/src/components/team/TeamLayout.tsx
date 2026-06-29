"use client";

import { Suspense } from "react";
import { useUser } from "@hexclave/next";
import { TeamSection } from "@/components/team/TeamSection";
import { TeamsPageSkeleton } from "@/components/team/TeamsPageSkeleton";

function TeamLayoutContent() {
  const user = useUser({ or: "redirect" });
  const team = user.selectedTeam;

  if (!team) {
    return (
      <div className="flex w-full flex-1 flex-col gap-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Manage team
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Choose a Hexclave team before managing members and invitations.
        </p>
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
