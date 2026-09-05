"use client";

import { api } from "@convex/_generated/api";
import type { CurrentUser, Team } from "@hexclave/next";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useState } from "react";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { InviteModal } from "@/components/team/InviteModal";
import { TeamMembersTable } from "@/components/team/TeamMembersTable";
import { TeamStats } from "@/components/team/TeamStats";
import { currentTimeBucket } from "@/lib/time-bucket";

type TeamTableRow = {
  email: string | null;
  id: string;
  imageUrl: string | null;
  lastActivity: string;
  name: string | null;
  status: "Active" | "Invited";
  subtitle: string;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export type { TeamTableRow };

export function TeamMembersContent({
  team,
  user,
}: {
  team: Team;
  user: CurrentUser;
}) {
  const canReadMembers = user.usePermission(team, "$read_members") != null;
  const canInviteMembers = user.usePermission(team, "$invite_members") != null;
  const members = team.useUsers();
  const invitations = team.useInvitations();
  const [nowMs] = useState(() => currentTimeBucket());
  const entitlements = useQuery(api.billing.getEntitlements, { nowMs });

  if (!canReadMembers) {
    return (
      <div className="flex w-full flex-1 flex-col gap-6">
        <DashboardPageTitle
          title="Manage team"
          description={`Manage who can work inside ${team.displayName}.`}
        />
        <div className="rounded-4xl border border-border bg-background/40 p-5 text-sm text-muted-foreground">
          You do not have permission to read team members.
        </div>
      </div>
    );
  }

  const rows: TeamTableRow[] = [
    ...members.map((member) => {
      const isCurrentUser = member.id === user.id;
      return {
        email: isCurrentUser ? user.primaryEmail : null,
        id: member.id,
        imageUrl:
          member.teamProfile.profileImageUrl ??
          (isCurrentUser ? user.profileImageUrl : null),
        lastActivity: "—",
        name:
          member.teamProfile.displayName ??
          (isCurrentUser ? user.displayName : null),
        status: "Active" as const,
        subtitle: "Team member",
      };
    }),
    ...invitations.map((invitation) => ({
      email: invitation.recipientEmail,
      id: invitation.id,
      imageUrl: null,
      lastActivity: `Expires ${dateFormatter.format(invitation.expiresAt)}`,
      name: "Pending invite",
      status: "Invited" as const,
      subtitle: "Awaiting response",
    })),
  ];

  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <DashboardPageTitle
        title="Manage team"
        description={`Manage who can work inside ${team.displayName}.`}
        actions={
          canInviteMembers ? (
            <InviteModal
              invitationsCount={invitations.length}
              membersCount={members.length}
              team={team}
              teamSeatLimit={entitlements?.teamSeatLimit}
            />
          ) : undefined
        }
      />

      <TeamStats
        invitationsCount={invitations.length}
        membersCount={members.length}
        teamSeatLimit={entitlements?.teamSeatLimit}
      />

      <TeamMembersTable rows={rows} />
    </div>
  );
}
