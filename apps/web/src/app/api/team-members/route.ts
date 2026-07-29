import type { ServerTeam } from "@hexclave/next";

import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { api } from "@convex/_generated/api";
import {
  getHexclaveConvexServerToken,
  hexclaveServerApp,
} from "@/hexclave/server";
import { assertSameOrigin } from "@/lib/oauth/env";

const responseOptions = {
  headers: { "Cache-Control": "private, no-store" },
};

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status, ...responseOptions });

const isEmail = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 320 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

async function getRouteContext(request: NextRequest) {
  const [user, token] = await Promise.all([
    hexclaveServerApp.getUser({ tokenStore: request }),
    getHexclaveConvexServerToken(request),
  ]);

  return {
    user,
    token,
    team: (user?.selectedTeam as ServerTeam | null | undefined) ?? null,
  };
}

export async function GET(request: NextRequest) {
  const { user, token, team } = await getRouteContext(request);

  if (!user || !token) {
    return errorResponse("Unauthorized", 401);
  }

  if (!team) {
    return errorResponse("No selected team", 400);
  }

  const [canReadMembers, entitlements] = await Promise.all([
    user.hasPermission(team, "$read_members"),
    fetchQuery(api.billing.getEntitlements, {}, { token }),
  ]);

  if (!canReadMembers) {
    return errorResponse(
      "You do not have permission to read team members",
      403,
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
      entitlements,
    },
    responseOptions,
  );
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch {
    return errorResponse("Invalid request origin", 403);
  }

  const { user, token, team } = await getRouteContext(request);

  if (!user || !token) {
    return errorResponse("Unauthorized", 401);
  }

  if (!team) {
    return errorResponse("No selected team", 400);
  }

  const payload = (await request.json().catch(() => ({}))) as {
    email?: unknown;
  };
  const email = typeof payload.email === "string" ? payload.email.trim() : null;

  if (!isEmail(email)) {
    return errorResponse("Enter a valid email address", 400);
  }

  const [canInviteMembers, entitlements] = await Promise.all([
    user.hasPermission(team, "$invite_members"),
    fetchQuery(api.billing.getEntitlements, {}, { token }),
  ]);

  if (!canInviteMembers) {
    return errorResponse(
      "You do not have permission to invite team members",
      403,
    );
  }

  const [members, invitations] = await Promise.all([
    team.listUsers(),
    team.listInvitations(),
  ]);
  const usedSeats = members.length + invitations.length;

  if (usedSeats >= entitlements.teamSeatLimit) {
    return errorResponse(
      `Team seat limit reached (${usedSeats}/${entitlements.teamSeatLimit}). Upgrade your plan to invite more members.`,
      409,
    );
  }

  try {
    await team.inviteUser({ email });
    return NextResponse.json({ ok: true }, { status: 201, ...responseOptions });
  } catch (error) {
    console.error(
      "[team-members/invite]",
      error instanceof Error ? error.message : error,
    );
    return errorResponse("Could not send team invitation", 502);
  }
}
