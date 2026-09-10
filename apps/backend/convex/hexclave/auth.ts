import type { MutationCtx, QueryCtx } from "../_generated/server";
import { fail } from "../errors";

/**
 * Hexclave access tokens carry: sub, iss, aud, project_id, branch_id,
 * refresh_token_id, role ("authenticated"), name, email, email_verified,
 * selected_team_id, signed_up_at, is_anonymous, is_restricted,
 * restricted_reason, requires_totp_mfa.
 *
 * There is NO team-role/permission claim and Convex functions cannot call the
 * Hexclave API, so `selected_team_id` cannot be re-verified here — Hexclave
 * asserts membership when the claim is minted. All callers must scope every
 * document read/write by `user.selectedTeamId` (as they do today).
 */
export async function getCurrentHexclaveUser(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return { authenticated: false as const, error: "Unauthenticated." };
  }

  // The customJwt provider config has no applicationID, so Convex does not
  // check the audience — bind the token to this project explicitly.
  const expectedProjectId = process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID;
  if (!expectedProjectId) {
    return {
      authenticated: false as const,
      error: "Auth is not configured.",
    };
  }

  if (
    !identity.subject ||
    identity.role !== "authenticated" ||
    typeof identity.is_anonymous !== "boolean" ||
    typeof identity.is_restricted !== "boolean" ||
    typeof identity.selected_team_id !== "string" ||
    !identity.selected_team_id ||
    identity.project_id !== expectedProjectId
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

  // Tokens minted while a TOTP challenge is still pending must not get access.
  if (identity.requires_totp_mfa === true) {
    return {
      authenticated: false as const,
      error: "Multi-factor verification is required.",
    };
  }

  return {
    authenticated: true as const,
    user: {
      id: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email,
      emailVerified: identity.email_verified === true,
      isAnonymous: identity.is_anonymous,
      isRestricted: identity.is_restricted,
      name: identity.name,
      role: identity.role,
      selectedTeamId: identity.selected_team_id,
      projectId: identity.project_id,
    },
  };
}

export async function requireUser(ctx: MutationCtx | QueryCtx) {
  const auth = await getCurrentHexclaveUser(ctx);
  if (!auth.authenticated) fail("UNAUTHENTICATED", auth.error);
  return auth.user;
}
