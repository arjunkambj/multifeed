import { v } from "convex/values";

export const planKey = v.union(
  v.literal("creator"),
  v.literal("growth"),
  v.literal("agency"),
);

export const billingInterval = v.union(v.literal("month"), v.literal("year"));

export const billingSubscriptionStatus = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("renewed"),
  v.literal("updated"),
  v.literal("plan_changed"),
  v.literal("cancelled"),
  v.literal("on_hold"),
  v.literal("failed"),
  v.literal("expired"),
);