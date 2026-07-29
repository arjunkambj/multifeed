import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { entitlementsForTeam } from "../billing";

const COUNTED_ACCOUNT_STATUSES = ["active", "expired", "error"] as const;

/** Max connected accounts for the team based on active subscription. */
export async function accountLimitForTeam(
  ctx: QueryCtx | MutationCtx,
  teamId: string,
) {
  const entitlements = await entitlementsForTeam(ctx, teamId);
  return entitlements.connectedAccountLimit;
}

async function countConnectedAccounts(
  ctx: QueryCtx | MutationCtx,
  teamId: string,
  limit: number,
) {
  const accounts = await Promise.all(
    COUNTED_ACCOUNT_STATUSES.map((status) =>
      ctx.db
        .query("connectedAccounts")
        .withIndex("by_team_status", (q) =>
          q.eq("teamId", teamId).eq("status", status),
        )
        .take(limit),
    ),
  );

  return accounts.reduce((count, rows) => count + rows.length, 0);
}

export async function assertCanConnect(
  ctx: QueryCtx | MutationCtx,
  teamId: string,
  additionalAccounts = 1,
) {
  const limit = await accountLimitForTeam(ctx, teamId);

  const count = await countConnectedAccounts(ctx, teamId, limit);
  if (count + additionalAccounts > limit) {
    throw new ConvexError({
      code: "PLAN_LIMIT_REACHED",
      resource: "connected_accounts",
      current: count,
      limit,
      message: `Account limit reached (${count}/${limit}). Upgrade your plan to connect more accounts.`,
    });
  }
}
