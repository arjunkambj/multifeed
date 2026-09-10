"use client";

import { Icon } from "@iconify/react";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { TeamStatsSkeleton } from "@/components/team/TeamStats";
import { TeamTableSkeleton } from "@/components/team/TeamTableSkeleton";
import { Button } from "@/components/ui/button";

export function InviteMemberFallback() {
  return (
    <Button tabIndex={-1} className="pointer-events-none" aria-hidden>
      <Icon icon="hugeicons:user-add-02" width={16} />
      Invite member
    </Button>
  );
}

export function TeamPageSkeleton({ teamName }: { teamName?: string }) {
  return (
    <div
      className="flex w-full flex-1 flex-col gap-6"
      aria-busy="true"
      role="status"
    >
      <span className="sr-only">Loading team</span>
      <DashboardPageTitle
        title="Manage team"
        description={
          teamName
            ? `Manage who can work inside ${teamName}.`
            : "Manage who can work inside your team."
        }
        actions={<InviteMemberFallback />}
      />
      <TeamStatsSkeleton />
      <TeamTableSkeleton />
    </div>
  );
}
