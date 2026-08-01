"use client";

import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { InvitePopover } from "@/components/team/InvitePopover";
import { TeamMembersContent } from "@/components/team/TeamMembersContent";
import type { TeamData } from "@/lib/team-data";

export function TeamSection({
  canInviteMembers,
  canReadMembers,
  initialData,
  team,
}: {
  canInviteMembers: boolean;
  canReadMembers: boolean;
  initialData?: TeamData;
  team: { id: string; displayName: string };
}) {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <DashboardPageTitle
        title="Manage team"
        description={`Manage who can work inside ${team.displayName}.`}
        actions={
          canInviteMembers ? (
            <InvitePopover initialData={initialData} teamId={team.id} />
          ) : undefined
        }
      />

      {canReadMembers ? (
        <TeamMembersContent initialData={initialData} teamId={team.id} />
      ) : (
        <div className="rounded-4xl border border-border bg-background/40 p-5 text-sm text-muted">
          You do not have permission to read team members.
        </div>
      )}
    </div>
  );
}
