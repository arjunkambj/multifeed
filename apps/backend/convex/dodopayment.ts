import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireUser } from "./billing/auth";
import { SUBSCRIPTION_EVENT_STATUS } from "./billing/constants";
import { getSubscriptionId } from "./billing/dodoEvent";
import {
  getLatestForTeam,
  hasActiveSubscription,
  hasPlanAccess,
  toSnapshot,
  upsertFromWebhook,
} from "./billing/subscriptions";
import type { DodoSubscriptionEvent } from "./billing/types";
import { billingInterval, planKey } from "./billing/validators";

export { hasActiveSubscription, hasPlanAccess };

export const getCurrentSubscription = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const subscription = await getLatestForTeam(ctx, user.selectedTeamId);

    return subscription ? toSnapshot(subscription) : null;
  },
});

export const recordCheckoutStarted = mutation({
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
    const current = await getLatestForTeam(ctx, user.selectedTeamId);

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

export const applyWebhookEvent = internalMutation({
  args: {
    webhookId: v.string(),
    eventType: v.string(),
    eventTimestamp: v.optional(v.number()),
    rawEvent: v.any(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const alreadyProcessed = await ctx.db
      .query("dodoWebhookEvents")
      .withIndex("by_webhook_id", (q) => q.eq("webhookId", args.webhookId))
      .first();

    if (alreadyProcessed) {
      return { duplicate: true };
    }

    const event = args.data as DodoSubscriptionEvent;
    const status = SUBSCRIPTION_EVENT_STATUS[args.eventType];

    if (status) {
      await upsertFromWebhook(ctx, status, event, args.eventTimestamp);
    }

    await ctx.db.insert("dodoWebhookEvents", {
      webhookId: args.webhookId,
      eventType: args.eventType,
      processedAt: Date.now(),
      eventTimestamp: args.eventTimestamp,
      teamId:
        typeof event.metadata?.teamId === "string"
          ? event.metadata.teamId
          : undefined,
      subscriptionId: getSubscriptionId(event),
      rawEvent: args.rawEvent,
    });

    return { duplicate: false };
  },
});