import type { MutationCtx, QueryCtx } from "../_generated/server";
import { fail } from "../errors";

export async function getCurrentHexclaveUser(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return { authenticated: false as const, error: "Unauthenticated." };
  }

  return {
    authenticated: true as const,
    user: {
      id: identity.tokenIdentifier,
      email: identity.email,
      isAnonymous: identity.is_anonymous as boolean,
      isRestricted: identity.is_restricted as boolean,
      name: identity.name,
      role: identity.role as "authenticated",
      selectedTeamId: identity.selected_team_id as string,
    },
  };
}

export async function requireUser(ctx: MutationCtx | QueryCtx) {
  const auth = await getCurrentHexclaveUser(ctx);
  if (!auth.authenticated) fail("UNAUTHENTICATED", auth.error);
  return auth.user;
}
