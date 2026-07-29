"use client";

import type { Team } from "@hexclave/next";

import { useQuery } from "@tanstack/react-query";
import { TeamMembersTable } from "@/components/team/TeamMembersTable";
import { TeamStats } from "@/components/team/TeamStats";
import { TeamTableSkeleton } from "@/components/team/TeamTableSkeleton";
import { loadTeamData, teamDataQueryKey } from "@/lib/team-data";

type TeamTableRow = {
  email: string | null;
  id: string;
  imageUrl: string | null;
  lastActivity: string;
  name: string | null;
  status: "Active" | "Invited";
  subtitle: string;
};

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);

export type { TeamTableRow };

export function TeamMembersContent({ team }: { team: Team }) {
  const teamDataQuery = useQuery({
    queryFn: loadTeamData,
    queryKey: teamDataQueryKey(team.id),
  });
  const isPending = teamDataQuery.isPending;
  const teamMembers = teamDataQuery.data?.members ?? [];
  const invitations = teamDataQuery.data?.invitations ?? [];
  const error = teamDataQuery.error;

  const rows: TeamTableRow[] = [
    ...teamMembers.map((member) => ({
      email: member.primaryEmail,
      id: member.id,
      imageUrl: member.profileImageUrl,
      lastActivity: formatDate(new Date(member.lastActiveAt)),
      name: member.displayName,
      status: "Active" as const,
      subtitle: "Team member",
    })),
    ...invitations.map((invitation) => ({
      email: invitation.recipientEmail,
      id: invitation.id,
      imageUrl: null,
      lastActivity: `Expires ${formatDate(new Date(invitation.expiresAt))}`,
      name: "Pending invite",
      status: "Invited" as const,
      subtitle: "Awaiting response",
    })),
  ];

  return (
    <>
      <TeamStats
        invitationsCount={invitations.length}
        membersCount={teamMembers.length}
        teamSeatLimit={teamDataQuery.data?.entitlements.teamSeatLimit}
      />

      {isPending ? (
        <TeamTableSkeleton />
      ) : (
        <TeamMembersTable membersError={error} rows={rows} />
      )}
    </>
  );
}
