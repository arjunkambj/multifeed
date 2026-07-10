import type { MutationCtx, QueryCtx } from "../_generated/server";

const ACTIVE = new Set(["active", "renewed", "updated", "plan_changed"]);

const PLAN_LIMITS: Record<string, number> = {
  creator: 15,
  growth: 50,
  agency: Number.POSITIVE_INFINITY,
};

const COUNTED_ACCOUNT_STATUSES = ["active", "expired", "error"] as const;

/** Max connected accounts for the team based on active subscription. */
export async function accountLimitForTeam(
  ctx: QueryCtx | MutationCtx,
  teamId: string,
) {
  const rows = await Promise.all(
    ["active", "renewed", "updated", "plan_changed"].map((status) =>
      ctx.db
        .query("billingSubscriptions")
        .withIndex("by_team_status_updated", (q) =>
          q.eq("teamId", teamId).eq("status", status as "active"),
        )
        .order("desc")
        .first(),
    ),
  );

  const sub = rows
    .flatMap((r) => (r ? [r] : []))
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];

  if (!sub || !ACTIVE.has(sub.status)) {
    // Soft default for local/dev. Set BILLING_SOFT_LIMITS=false in production
    // to require an active subscription before connecting accounts.
    if (process.env.BILLING_SOFT_LIMITS === "false") {
      return 0;
    }
    return PLAN_LIMITS.creator ?? 15;
  }

  return PLAN_LIMITS[sub.planKey] ?? PLAN_LIMITS.creator ?? 15;
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
) {
  const limit = await accountLimitForTeam(ctx, teamId);
  if (!Number.isFinite(limit)) return;

  const count = await countConnectedAccounts(ctx, teamId, limit);
  if (count >= limit) {
    throw new Error(
      `Account limit reached (${count}/${limit}). Upgrade your plan to connect more accounts.`,
    );
  }
}
