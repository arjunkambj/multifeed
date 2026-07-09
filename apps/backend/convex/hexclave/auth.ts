import { z } from "zod";
import type { MutationCtx, QueryCtx } from "../_generated/server";

const HexclaveUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  isAnonymous: z.boolean(),
  isRestricted: z.boolean(),
  name: z.string(),
  role: z.literal("authenticated"),
  selectedTeamId: z.string(),
});

export async function getCurrentHexclaveUser(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (identity == null) {
    return { authenticated: false as const, error: "Unauthenticated." };
  }

  const user = HexclaveUserSchema.safeParse({
    id: identity.subject,
    email: identity.email,
    isAnonymous: identity.is_anonymous,
    isRestricted: identity.is_restricted,
    name: identity.name,
    role: identity.role,
    selectedTeamId: identity.selected_team_id,
  });

  if (!user.success) {
    return {
      authenticated: false as const,
      error: "Missing Hexclave user claims.",
    };
  }

  return { authenticated: true as const, user: user.data };
}

export async function requireUser(ctx: MutationCtx | QueryCtx) {
  const auth = await getCurrentHexclaveUser(ctx);
  if (!auth.authenticated) throw new Error(auth.error);
  return auth.user;
}
