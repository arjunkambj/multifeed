export type PlanKey = "creator" | "growth" | "agency";

export type BillingStatus =
  | "pending"
  | "active"
  | "renewed"
  | "updated"
  | "plan_changed"
  | "cancelled"
  | "on_hold"
  | "failed"
  | "expired";

/** Shape of `data` in Dodo subscription webhook payloads (snake + camel). */
export type DodoSubscriptionEvent = {
  subscription_id?: string;
  subscriptionId?: string;
  customer_id?: string;
  customerId?: string;
  product_id?: string;
  productId?: string;
  checkout_session_id?: string;
  metadata?: Record<string, unknown>;
  customer?: {
    customer_id?: string;
    customerId?: string;
  };
  next_billing_date?: string;
  current_period_end?: string;
  expires_at?: string;
  cancelled_at?: string;
  cancel_at_next_billing_date?: boolean;
};

export type SubscriptionSnapshot = {
  planKey: PlanKey;
  interval: "month" | "year";
  status: BillingStatus;
  currentPeriodEnd?: number;
  accessEndsAt?: number;
  updatedAt: number;
};