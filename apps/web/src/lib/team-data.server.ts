import "server-only";

import type { ServerTeam } from "@hexclave/next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { TeamData } from "@/lib/team-data";
import { currentTimeBucket } from "@/lib/time-bucket";

export async function loadServerTeamData(
  team: ServerTeam,
  token: string,
): Promise<TeamData> {
  const [members, invitations, entitlements] = await Promise.all([
    team.listUsers(),
    team.listInvitations(),
    fetchQuery(
      api.billing.getEntitlements,
      { nowMs: currentTimeBucket() },
      { token },
    ),
  ]);

  return {
    invitations: invitations.map((invitation) => ({
      id: invitation.id,
      recipientEmail: invitation.recipientEmail,
      expiresAt: invitation.expiresAt.toISOString(),
    })),
    members: members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      lastActiveAt: member.lastActiveAt.toISOString(),
      primaryEmail: member.primaryEmail,
      profileImageUrl: member.profileImageUrl,
    })),
    entitlements,
  };
}
