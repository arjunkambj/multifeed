export type TeamMember = {
  id: string;
  displayName: string | null;
  lastActiveAt: string;
  primaryEmail: string | null;
  profileImageUrl: string | null;
};

export type TeamInvitation = {
  id: string;
  expiresAt: string;
  recipientEmail: string | null;
};

export type TeamEntitlements = {
  planKey: "creator" | "growth" | "agency" | null;
  hasActivePlan: boolean;
  connectedAccountLimit: number;
  teamSeatLimit: number;
};

export type TeamData = {
  invitations: TeamInvitation[];
  members: TeamMember[];
  entitlements: TeamEntitlements;
};

export const teamDataQueryKey = (teamId: string) =>
  ["team-data", teamId] as const;

export const loadTeamData = async ({ signal }: { signal: AbortSignal }) => {
  const response = await fetch("/api/team-members", { signal });
  if (!response.ok) {
    throw new Error("Unable to load team members");
  }
  const payload = (await response.json()) as TeamData | { error?: string };

  if ("error" in payload && payload.error) {
    throw new Error(
      payload.error,
    );
  }

  if (
    !("invitations" in payload) ||
    !("members" in payload) ||
    !("entitlements" in payload)
  ) {
    throw new Error("Missing team data response");
  }

  return payload;
};
