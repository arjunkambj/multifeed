import type { MutationCtx, QueryCtx } from "../_generated/server";
import { entitlementsForTeam } from "../billing";

const COUNTED_ACCOUNT_STATUSES = ["active", "expired", "error"] as const;

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
  const { connectedAccountLimit: limit } = await entitlementsForTeam(
    ctx,
    teamId,
    Date.now(),
  );
  const count = await countConnectedAccounts(ctx, teamId, limit);
  return { count, limit };
}
