import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { ACTIVE_STATUSES, BILLING_STATUSES, PLAN_RANKS } from "./constants";
import {
  asBillingInterval,
  asPlanKey,
  getAccessEndsAt,
  getCurrentPeriodEnd,
  getCustomerId,
  getProductId,
  getSubscriptionId,
} from "./dodoEvent";
import type {
  BillingStatus,
  DodoSubscriptionEvent,
  PlanKey,
  SubscriptionSnapshot,
} from "./types";

type Ctx = MutationCtx | QueryCtx;

const statusPriority = (status: BillingStatus) => {
  if (ACTIVE_STATUSES.has(status)) {
    return 2;
  }

  if (status === "pending") {
    return 1;
  }

  return 0;
};

export const getLatestForTeam = async (ctx: Ctx, teamId: string) => {
  const subscriptions = await Promise.all(
    BILLING_STATUSES.map((status) =>
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
    subscriptions
      .flatMap((subscription) => (subscription ? [subscription] : []))
      .sort(
        (left, right) =>
          statusPriority(right.status) - statusPriority(left.status) ||
          right.updatedAt - left.updatedAt,
      )[0] ?? null
  );
};

export const hasActiveSubscription = async (ctx: Ctx, teamId: string) => {
  const subscription = await getLatestForTeam(ctx, teamId);
  return subscription ? ACTIVE_STATUSES.has(subscription.status) : false;
};

export const hasPlanAccess = async (
  ctx: Ctx,
  teamId: string,
  minimumPlan: PlanKey,
) => {
  const subscription = await getLatestForTeam(ctx, teamId);
  const plan = asPlanKey(subscription?.planKey);

  if (!subscription || !plan || !ACTIVE_STATUSES.has(subscription.status)) {
    return false;
  }

  return PLAN_RANKS[plan] >= PLAN_RANKS[minimumPlan];
};

export const toSnapshot = (
  subscription: Doc<"billingSubscriptions">,
): SubscriptionSnapshot => ({
  planKey: subscription.planKey,
  interval: subscription.interval,
  status: subscription.status,
  currentPeriodEnd: subscription.currentPeriodEnd,
  accessEndsAt: subscription.accessEndsAt,
  updatedAt: subscription.updatedAt,
});

type ResolvedSubscriptionFields = {
  teamId: string;
  userId: string;
  planKey: PlanKey;
  interval: "month" | "year";
  dodoProductId: string;
};

const resolveFields = (
  event: DodoSubscriptionEvent,
  existing: Doc<"billingSubscriptions"> | null,
): ResolvedSubscriptionFields | null => {
  const metadata = event.metadata ?? {};

  const teamId =
    typeof metadata.teamId === "string" ? metadata.teamId : existing?.teamId;
  const userId =
    typeof metadata.userId === "string" ? metadata.userId : existing?.userId;
  const planKey = asPlanKey(metadata.planKey) ?? existing?.planKey;
  const interval = asBillingInterval(metadata.interval) ?? existing?.interval;
  const dodoProductId = getProductId(event) ?? existing?.dodoProductId;

  if (!teamId || !userId || !planKey || !interval || !dodoProductId) {
    return null;
  }

  return { teamId, userId, planKey, interval, dodoProductId };
};

export const upsertFromWebhook = async (
  ctx: MutationCtx,
  status: BillingStatus,
  event: DodoSubscriptionEvent,
  rawEventTimestamp: number | undefined,
): Promise<Id<"billingSubscriptions"> | null> => {
  const dodoSubscriptionId = getSubscriptionId(event);
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

  const fields = resolveFields(event, existing);

  if (!fields) {
    return null;
  }

  const now = Date.now();
  const accessEndsAt = ACTIVE_STATUSES.has(status)
    ? undefined
    : (getAccessEndsAt(event, status) ?? existing?.accessEndsAt);

  const record = {
    ...fields,
    status,
    dodoSubscriptionId,
    dodoCustomerId: getCustomerId(event) ?? existing?.dodoCustomerId,
    currentPeriodEnd: getCurrentPeriodEnd(event) ?? existing?.currentPeriodEnd,
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
};
