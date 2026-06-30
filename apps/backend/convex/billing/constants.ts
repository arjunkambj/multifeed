import type { BillingStatus, PlanKey } from "./types";

export const ACTIVE_STATUSES = new Set<BillingStatus>([
  "active",
  "renewed",
  "updated",
  "plan_changed",
]);

export const BILLING_STATUSES = [
  "pending",
  "active",
  "renewed",
  "updated",
  "plan_changed",
  "cancelled",
  "on_hold",
  "failed",
  "expired",
] as const satisfies BillingStatus[];

export const PLAN_RANKS: Record<PlanKey, number> = {
  creator: 0,
  growth: 1,
  agency: 2,
};

/** Maps Dodo webhook event types to the subscription status we store. */
export const SUBSCRIPTION_EVENT_STATUS: Record<string, BillingStatus> = {
  "subscription.active": "active",
  "subscription.updated": "updated",
  "subscription.renewed": "renewed",
  "subscription.plan_changed": "plan_changed",
  "subscription.cancelled": "cancelled",
  "subscription.on_hold": "on_hold",
  "subscription.failed": "failed",
  "subscription.expired": "expired",
};
