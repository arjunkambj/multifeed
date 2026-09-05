import type { MutationCtx, QueryCtx } from "../_generated/server";
import { fail } from "../errors";

export async function getCurrentHexclaveUser(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return { authenticated: false as const, error: "Unauthenticated." };
  }

  if (
    !identity.subject ||
    identity.role !== "authenticated" ||
    typeof identity.is_anonymous !== "boolean" ||
    typeof identity.is_restricted !== "boolean" ||
    typeof identity.selected_team_id !== "string" ||
    !identity.selected_team_id
  ) {
    return {
      authenticated: false as const,
      error: "Missing Hexclave user or team claims.",
    };
  }

  if (identity.is_anonymous || identity.is_restricted) {
    return {
      authenticated: false as const,
      error: "An unrestricted account is required.",
    };
  }

  return {
    authenticated: true as const,
    user: {
      id: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email,
      isAnonymous: identity.is_anonymous,
      isRestricted: identity.is_restricted,
      name: identity.name,
      role: identity.role,
      selectedTeamId: identity.selected_team_id,
    },
  };
}

export async function requireUser(ctx: MutationCtx | QueryCtx) {
  const auth = await getCurrentHexclaveUser(ctx);
  if (!auth.authenticated) fail("UNAUTHENTICATED", auth.error);
  return auth.user;
}
