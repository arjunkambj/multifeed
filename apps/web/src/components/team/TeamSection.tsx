"use client";

import type { Team } from "@hexclave/next";

import { useUser } from "@hexclave/next";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { InvitePopover } from "@/components/team/InvitePopover";
import { TeamMembersContent } from "@/components/team/TeamMembersContent";

export function TeamSection({ team }: { team: Team }) {
  const user = useUser({ or: "redirect" });
  const canReadMembers = user.usePermission(team, "$read_members");
  const canInviteMembers = user.usePermission(team, "$invite_members");

  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <DashboardPageTitle
        title="Manage team"
        description={`Manage who can work inside ${team.displayName}.`}
        actions={canInviteMembers ? <InvitePopover team={team} /> : undefined}
      />

      {canReadMembers ? (
        <TeamMembersContent team={team} />
      ) : (
        <div className="rounded-4xl border border-border bg-background/40 p-5 text-sm text-muted">
          You do not have permission to read team members.
        </div>
      )}
    </div>
  );
}
