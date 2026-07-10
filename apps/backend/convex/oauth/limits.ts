import type { MutationCtx, QueryCtx } from "../_generated/server";

const ACTIVE = new Set(["active", "renewed", "updated", "plan_changed"]);

const PLAN_LIMITS: Record<string, number> = {
  creator: 15,
  growth: 50,
  agency: Number.POSITIVE_INFINITY,
};

/** Max connected accounts for the team based on active subscription. */
export async function accountLimitForTeam(
  ctx: QueryCtx | MutationCtx,
  teamId: string,
): Promise<number> {
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

export async function countConnectedAccounts(
  ctx: QueryCtx | MutationCtx,
  teamId: string,
): Promise<number> {
  const accounts = await ctx.db
    .query("connectedAccounts")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();
  // Only active-ish accounts count toward the plan limit.
  return accounts.filter(
    (a) => a.status !== "pending_selection" && a.status !== "revoked",
  ).length;
}

export async function assertCanConnect(
  ctx: QueryCtx | MutationCtx,
  teamId: string,
): Promise<void> {
  const [limit, count] = await Promise.all([
    accountLimitForTeam(ctx, teamId),
    countConnectedAccounts(ctx, teamId),
  ]);
  if (count >= limit) {
    throw new Error(
      `Account limit reached (${count}/${limit}). Upgrade your plan to connect more accounts.`,
    );
  }
}
