import type { MutationCtx, QueryCtx } from "../_generated/server";
import { entitlementsForTeam } from "../billing";
import { fail } from "../errors";

const COUNTED_ACCOUNT_STATUSES = ["active", "expired", "error"] as const;

/** Max connected accounts for the team based on active subscription. */
export async function accountLimitForTeam(
  ctx: QueryCtx | MutationCtx,
  teamId: string,
  now: number,
) {
  const entitlements = await entitlementsForTeam(ctx, teamId, now);
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

/** Current connected-account usage against the team's plan limit. */
export async function accountLimitUsage(
  ctx: QueryCtx | MutationCtx,
  teamId: string,
) {
  const limit = await accountLimitForTeam(ctx, teamId, Date.now());
  const count = await countConnectedAccounts(ctx, teamId, limit);
  return { count, limit };
}

export async function assertCanConnect(
  ctx: QueryCtx | MutationCtx,
  teamId: string,
  additionalAccounts = 1,
) {
  const { count, limit } = await accountLimitUsage(ctx, teamId);
  if (count + additionalAccounts > limit) {
    fail(
      "PLAN_LIMIT_REACHED",
      `Account limit reached (${count}/${limit}). Upgrade your plan to connect more accounts.`,
      { resource: "connected_accounts", current: count, limit },
    );
  }
}
