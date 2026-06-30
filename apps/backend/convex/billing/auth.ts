import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getCurrentHexclaveUser } from "../hexclave/auth";

type Ctx = MutationCtx | QueryCtx;

export const requireUser = async (ctx: Ctx) => {
  const auth = await getCurrentHexclaveUser(ctx);

  if (!auth.authenticated) {
    throw new Error(auth.error);
  }

  return auth.user;
};