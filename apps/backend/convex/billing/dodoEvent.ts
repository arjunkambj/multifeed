import type { BillingStatus, DodoSubscriptionEvent, PlanKey } from "./types";

export const parseTimestamp = (value: unknown): number | undefined => {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    return undefined;
  }

  return Date.parse(value);
};

const firstString = (...values: Array<unknown>): string | undefined => {
  for (const value of values) {
    if (typeof value === "string") {
      return value;
    }
  }

  return undefined;
};

export const asPlanKey = (value: unknown): PlanKey | undefined =>
  value === "creator" || value === "growth" || value === "agency"
    ? value
    : undefined;

export const asBillingInterval = (
  value: unknown,
): "month" | "year" | undefined =>
  value === "month" || value === "year" ? value : undefined;

export const getSubscriptionId = (event: DodoSubscriptionEvent) =>
  firstString(event.subscription_id, event.subscriptionId);

export const getCustomerId = (event: DodoSubscriptionEvent) =>
  firstString(
    event.customer_id,
    event.customerId,
    event.customer?.customer_id,
    event.customer?.customerId,
  );

export const getProductId = (event: DodoSubscriptionEvent) =>
  firstString(event.product_id, event.productId);

export const getCurrentPeriodEnd = (event: DodoSubscriptionEvent) =>
  parseTimestamp(event.next_billing_date) ??
  parseTimestamp(event.current_period_end) ??
  parseTimestamp(event.expires_at);

export const getAccessEndsAt = (
  event: DodoSubscriptionEvent,
  status: BillingStatus,
): number | undefined => {
  if (status === "expired" || status === "failed") {
    return Date.now();
  }

  if (status === "cancelled") {
    if (event.cancel_at_next_billing_date) {
      return getCurrentPeriodEnd(event);
    }

    return parseTimestamp(event.cancelled_at) ?? Date.now();
  }

  return undefined;
};