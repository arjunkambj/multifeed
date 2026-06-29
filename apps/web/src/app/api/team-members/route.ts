import type { ServerTeam } from "@hexclave/next";

import { hexclaveServerApp } from "@/hexclave/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const responseOptions = {
  headers: { "Cache-Control": "private, no-store" },
};

export async function GET(request: NextRequest) {
  const user = await hexclaveServerApp.getUser({ tokenStore: request });

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, ...responseOptions },
    );
  }

  const team = user.selectedTeam as ServerTeam | null;

  if (!team) {
    return NextResponse.json(
      { error: "No selected team" },
      { status: 400, ...responseOptions },
    );
  }

  const [members, invitations] = await Promise.all([
    team.listUsers(),
    team.listInvitations(),
  ]);

  return NextResponse.json(
    {
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
    },
    responseOptions,
  );
}
