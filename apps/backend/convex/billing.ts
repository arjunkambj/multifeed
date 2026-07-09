import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { requireUser } from "./hexclave/auth";

const planKey = v.union(
  v.literal("creator"),
  v.literal("growth"),
  v.literal("agency"),
);

const billingInterval = v.union(v.literal("month"), v.literal("year"));

const ACTIVE = new Set(["active", "renewed", "updated", "plan_changed"]);

const STATUSES = [
  "pending",
  "active",
  "renewed",
  "updated",
  "plan_changed",
  "cancelled",
  "on_hold",
  "failed",
  "expired",
] as const;

const EVENT_STATUS: Record<string, (typeof STATUSES)[number]> = {
  "subscription.active": "active",
  "subscription.updated": "updated",
  "subscription.renewed": "renewed",
  "subscription.plan_changed": "plan_changed",
  "subscription.cancelled": "cancelled",
  "subscription.on_hold": "on_hold",
  "subscription.failed": "failed",
  "subscription.expired": "expired",
};

const PLAN_RANK = { creator: 0, growth: 1, agency: 2 } as const;

function str(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function parseTime(value: unknown) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    return undefined;
  }
  return Date.parse(value);
}

function asPlan(value: unknown) {
  return value === "creator" || value === "growth" || value === "agency"
    ? value
    : undefined;
}

function asInterval(value: unknown) {
  return value === "month" || value === "year" ? value : undefined;
}

function statusRank(status: string) {
  if (ACTIVE.has(status)) return 2;
  if (status === "pending") return 1;
  return 0;
}

async function latestForTeam(ctx: QueryCtx | MutationCtx, teamId: string) {
  const rows = await Promise.all(
    STATUSES.map((status) =>
      ctx.db
        .query("billingSubscriptions")
        .withIndex("by_team_status_updated", (q) =>
          q.eq("teamId", teamId).eq("status", status),
        )
        .order("desc")
        .first(),
    ),
  );

  return (
    rows
      .flatMap((row) => (row ? [row] : []))
      .sort(
        (a, b) =>
          statusRank(b.status) - statusRank(a.status) ||
          b.updatedAt - a.updatedAt,
      )[0] ?? null
  );
}

function snapshot(sub: Doc<"billingSubscriptions">) {
  return {
    planKey: sub.planKey,
    interval: sub.interval,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    accessEndsAt: sub.accessEndsAt,
    updatedAt: sub.updatedAt,
  };
}

export async function hasActive(
  ctx: QueryCtx | MutationCtx,
  teamId: string,
) {
  const sub = await latestForTeam(ctx, teamId);
  return sub ? ACTIVE.has(sub.status) : false;
}

export async function hasPlan(
  ctx: QueryCtx | MutationCtx,
  teamId: string,
  minimum: keyof typeof PLAN_RANK,
) {
  const sub = await latestForTeam(ctx, teamId);
  const plan = asPlan(sub?.planKey);
  if (!sub || !plan || !ACTIVE.has(sub.status)) return false;
  return PLAN_RANK[plan] >= PLAN_RANK[minimum];
}

/** Current team subscription snapshot (or null). */
export const getSubscription = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const sub = await latestForTeam(ctx, user.selectedTeamId);
    return sub ? snapshot(sub) : null;
  },
});

/** Persist pending checkout after Dodo session is created. */
export const startCheckout = mutation({
  args: {
    planKey,
    interval: billingInterval,
    dodoProductId: v.string(),
    dodoCheckoutSessionId: v.optional(v.string()),
    dodoCheckoutUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const current = await latestForTeam(ctx, user.selectedTeamId);

    const pending = {
      teamId: user.selectedTeamId,
      userId: user.id,
      planKey: args.planKey,
      interval: args.interval,
      status: "pending" as const,
      dodoProductId: args.dodoProductId,
      dodoCheckoutSessionId: args.dodoCheckoutSessionId,
      dodoCheckoutUrl: args.dodoCheckoutUrl,
      updatedAt: now,
    };

    if (current?.status === "pending" && !current.dodoSubscriptionId) {
      await ctx.db.patch(current._id, pending);
      return current._id;
    }

    return await ctx.db.insert("billingSubscriptions", {
      ...pending,
      createdAt: now,
    });
  },
});

/** Dodo webhook handler — idempotent by webhookId. */
export const handleWebhook = internalMutation({
  args: {
    webhookId: v.string(),
    eventType: v.string(),
    eventTimestamp: v.optional(v.number()),
    rawEvent: v.any(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const seen = await ctx.db
      .query("dodoWebhookEvents")
      .withIndex("by_webhook_id", (q) => q.eq("webhookId", args.webhookId))
      .first();

    if (seen) return { duplicate: true };

    const event = args.data as Record<string, unknown>;
    const status = EVENT_STATUS[args.eventType];
    const subscriptionId = str(event.subscription_id, event.subscriptionId);

    if (status) {
      await upsertSubscription(ctx, status, event, args.eventTimestamp);
    }

    const metadata = (event.metadata ?? {}) as Record<string, unknown>;

    await ctx.db.insert("dodoWebhookEvents", {
      webhookId: args.webhookId,
      eventType: args.eventType,
      processedAt: Date.now(),
      eventTimestamp: args.eventTimestamp,
      teamId: str(metadata.teamId),
      subscriptionId,
      rawEvent: args.rawEvent,
    });

    return { duplicate: false };
  },
});

async function upsertSubscription(
  ctx: MutationCtx,
  status: (typeof STATUSES)[number],
  event: Record<string, unknown>,
  rawEventTimestamp: number | undefined,
) {
  const dodoSubscriptionId = str(event.subscription_id, event.subscriptionId);
  const existing = dodoSubscriptionId
    ? await ctx.db
        .query("billingSubscriptions")
        .withIndex("by_subscription", (q) =>
          q.eq("dodoSubscriptionId", dodoSubscriptionId),
        )
        .first()
    : null;

  if (
    existing?.rawEventTimestamp &&
    rawEventTimestamp &&
    rawEventTimestamp < existing.rawEventTimestamp
  ) {
    return existing._id;
  }

  const metadata = (event.metadata ?? {}) as Record<string, unknown>;
  const customer = (event.customer ?? {}) as Record<string, unknown>;

  const teamId = str(metadata.teamId) ?? existing?.teamId;
  const userId = str(metadata.userId) ?? existing?.userId;
  const plan = asPlan(metadata.planKey) ?? existing?.planKey;
  const interval = asInterval(metadata.interval) ?? existing?.interval;
  const dodoProductId =
    str(event.product_id, event.productId) ?? existing?.dodoProductId;

  if (!teamId || !userId || !plan || !interval || !dodoProductId) {
    return null;
  }

  const periodEnd =
    parseTime(event.next_billing_date) ??
    parseTime(event.current_period_end) ??
    parseTime(event.expires_at) ??
    existing?.currentPeriodEnd;

  let accessEndsAt = existing?.accessEndsAt;
  if (ACTIVE.has(status)) {
    accessEndsAt = undefined;
  } else if (status === "expired" || status === "failed") {
    accessEndsAt = Date.now();
  } else if (status === "cancelled") {
    accessEndsAt = event.cancel_at_next_billing_date
      ? periodEnd
      : (parseTime(event.cancelled_at) ?? Date.now());
  }

  const now = Date.now();
  const record = {
    teamId,
    userId,
    planKey: plan,
    interval,
    status,
    dodoSubscriptionId,
    dodoCustomerId:
      str(
        event.customer_id,
        event.customerId,
        customer.customer_id,
        customer.customerId,
      ) ?? existing?.dodoCustomerId,
    dodoProductId,
    currentPeriodEnd: periodEnd,
    accessEndsAt,
    rawEventTimestamp,
    updatedAt: now,
  };

  if (existing) {
    await ctx.db.patch(existing._id, record);
    return existing._id;
  }

  return await ctx.db.insert("billingSubscriptions", {
    ...record,
    createdAt: now,
  });
}
