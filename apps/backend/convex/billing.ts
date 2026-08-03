import { v } from "convex/values";
import { getPlanLimits, type PlanKey } from "@multifeed/plans";
import type { Doc } from "./_generated/dataModel";
import {
  internalMutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { requireUser } from "./hexclave/auth";
import {
  billingInterval,
  billingStatus,
  planKey as planKeyValidator,
} from "./schema";

/** Subscription statuses that grant product access. */
export const ACTIVE_BILLING = new Set([
  "active",
  "renewed",
  "updated",
  "plan_changed",
]);

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

type BillingStatus = (typeof STATUSES)[number];


const SUBSCRIPTION_EVENTS = new Set([
  "subscription.active",
  "subscription.updated",
  "subscription.renewed",
  "subscription.plan_changed",
  "subscription.cancelled",
  "subscription.on_hold",
  "subscription.failed",
  "subscription.expired",
]);

const entitlementValidator = v.object({
  planKey: v.union(planKeyValidator, v.null()),
  hasActivePlan: v.boolean(),
  connectedAccountLimit: v.number(),
  teamSeatLimit: v.number(),
});

const subscriptionSnapshotValidator = v.union(
  v.object({
    planKey: planKeyValidator,
    interval: billingInterval,
    status: billingStatus,
    hasPlanAccess: v.boolean(),
    canStartCheckout: v.boolean(),
    dodoCustomerId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    accessEndsAt: v.optional(v.number()),
    updatedAt: v.number(),
  }),
  v.null(),
);

function str(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function parseTime(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value > 1e11 ? value : value * 1000;
  }
  if (typeof value === "string") {
    const num = Number(value);
    if (!Number.isNaN(num) && value.trim() !== "") {
      return num > 1e11 ? num : num * 1000;
    }
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

function asPlan(value: unknown): PlanKey | undefined {
  return value === "creator" || value === "growth" || value === "agency"
    ? value
    : undefined;
}

function asInterval(value: unknown) {
  return value === "month" || value === "year" ? value : undefined;
}

function webhookStatus(
  eventType: string,
  event: Record<string, unknown>,
): BillingStatus | undefined {
  if (!SUBSCRIPTION_EVENTS.has(eventType)) return undefined;

  const rawStatus = str(event.status);
  if (rawStatus && (STATUSES as readonly string[]).includes(rawStatus)) {
    return rawStatus as BillingStatus;
  }

  switch (eventType) {
    case "subscription.active":
      return "active";
    case "subscription.renewed":
      return "renewed";
    case "subscription.plan_changed":
      return "plan_changed";
    case "subscription.updated":
      return "updated";
    case "subscription.cancelled":
      return "cancelled";
    case "subscription.on_hold":
      return "on_hold";
    case "subscription.failed":
      return "failed";
    case "subscription.expired":
      return "expired";
    default:
      return undefined;
  }
}

export function grantsPlanAccess(
  sub: Pick<Doc<"billingSubscriptions">, "status" | "accessEndsAt">,
  now: number,
) {
  return (
    ACTIVE_BILLING.has(sub.status) ||
    (sub.status === "cancelled" &&
      sub.accessEndsAt !== undefined &&
      sub.accessEndsAt > now)
  );
}

/** Only terminal subscriptions may be replaced with a new checkout. */
export function canStartCheckout(
  sub: Pick<Doc<"billingSubscriptions">, "status" | "accessEndsAt">,
  now: number,
) {
  return (
    sub.status === "failed" ||
    sub.status === "expired" ||
    (sub.status === "cancelled" && !grantsPlanAccess(sub, now))
  );
}

function statusRank(sub: Doc<"billingSubscriptions">, now: number) {
  return grantsPlanAccess(sub, now) ? 1 : 0;
}

export async function latestForTeam(
  ctx: QueryCtx | MutationCtx,
  teamId: string,
  now: number,
) {
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
      // Local checkout intent is never subscription truth.
      .flatMap((row) =>
        row?.dodoSubscriptionId && row.status !== "pending" ? [row] : [],
      )
      .sort(
        (a, b) =>
          statusRank(b, now) - statusRank(a, now) || b.updatedAt - a.updatedAt,
      )[0] ?? null
  );
}

function snapshot(sub: Doc<"billingSubscriptions">, now: number) {
  return {
    planKey: sub.planKey,
    interval: sub.interval,
    status: sub.status,
    hasPlanAccess: grantsPlanAccess(sub, now),
    canStartCheckout: canStartCheckout(sub, now),
    dodoCustomerId: sub.dodoCustomerId,
    currentPeriodEnd: sub.currentPeriodEnd,
    accessEndsAt: sub.accessEndsAt,
    updatedAt: sub.updatedAt,
  };
}

export async function entitlementsForTeam(
  ctx: QueryCtx | MutationCtx,
  teamId: string,
  now: number,
) {
  const sub = await latestForTeam(ctx, teamId, now);
  const plan =
    sub && grantsPlanAccess(sub, now) ? asPlan(sub.planKey) : undefined;
  const limits = getPlanLimits(plan ?? null);

  return {
    planKey: plan ?? null,
    hasActivePlan: plan !== undefined,
    connectedAccountLimit: limits.connectedAccounts,
    teamSeatLimit: limits.teamSeats,
  };
}

/** Current plan limits for the authenticated team. */
export const getEntitlements = query({
  args: { nowMs: v.number() },
  returns: entitlementValidator,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await entitlementsForTeam(ctx, user.selectedTeamId, args.nowMs);
  },
});

/** Current team subscription snapshot (or null). */
export const getSubscription = query({
  args: { nowMs: v.number() },
  returns: subscriptionSnapshotValidator,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const sub = await latestForTeam(ctx, user.selectedTeamId, args.nowMs);
    return sub ? snapshot(sub, args.nowMs) : null;
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
  returns: v.object({ duplicate: v.boolean() }),
  handler: async (ctx, args) => {
    const seen = await ctx.db
      .query("dodoWebhookEvents")
      .withIndex("by_webhook_id", (q) => q.eq("webhookId", args.webhookId))
      .first();

    if (seen) return { duplicate: true };

    const event = args.data as Record<string, unknown>;
    const status = webhookStatus(args.eventType, event);
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
  status: BillingStatus,
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

  if (
    !dodoSubscriptionId ||
    !teamId ||
    !userId ||
    !plan ||
    !interval ||
    !dodoProductId
  ) {
    return null;
  }

  const periodEnd =
    parseTime(event.next_billing_date) ??
    parseTime(event.current_period_end) ??
    parseTime(event.expires_at) ??
    existing?.currentPeriodEnd;

  let accessEndsAt = existing?.accessEndsAt;
  if (ACTIVE_BILLING.has(status)) {
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
    await ctx.db.patch("billingSubscriptions", existing._id, record);
    return existing._id;
  }

  return await ctx.db.insert("billingSubscriptions", {
    ...record,
    createdAt: now,
  });
}
