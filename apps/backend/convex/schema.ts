import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const planKey = v.union(
  v.literal("creator"),
  v.literal("growth"),
  v.literal("agency"),
);

const billingInterval = v.union(v.literal("month"), v.literal("year"));

const billingStatus = v.union(
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

const platform = v.union(
  v.literal("x"),
  v.literal("instagram"),
  v.literal("facebook"),
  v.literal("threads"),
  v.literal("linkedin"),
  v.literal("tiktok"),
  v.literal("youtube"),
  v.literal("pinterest"),
  v.literal("bluesky"),
  v.literal("google_business"),
);

const postStatus = v.union(
  v.literal("draft"),
  v.literal("scheduled"),
  v.literal("publishing"),
  v.literal("published"),
  v.literal("failed"),
  v.literal("archived"),
);

const targetStatus = v.union(
  v.literal("draft"),
  v.literal("scheduled"),
  v.literal("publishing"),
  v.literal("published"),
  v.literal("failed"),
  v.literal("skipped"),
);

const metricSyncStatus = v.union(
  v.literal("idle"),
  v.literal("queued"),
  v.literal("syncing"),
  v.literal("synced"),
  v.literal("failed"),
);

export default defineSchema({
  billingSubscriptions: defineTable({
    teamId: v.string(),
    userId: v.string(),
    planKey,
    interval: billingInterval,
    status: billingStatus,
    dodoSubscriptionId: v.optional(v.string()),
    dodoCustomerId: v.optional(v.string()),
    dodoProductId: v.string(),
    dodoCheckoutSessionId: v.optional(v.string()),
    dodoCheckoutUrl: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    accessEndsAt: v.optional(v.number()),
    rawEventTimestamp: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team_status_updated", ["teamId", "status", "updatedAt"])
    .index("by_subscription", ["dodoSubscriptionId"])
    .index("by_customer", ["dodoCustomerId"]),

  dodoWebhookEvents: defineTable({
    webhookId: v.string(),
    eventType: v.string(),
    processedAt: v.number(),
    eventTimestamp: v.optional(v.number()),
    teamId: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
    rawEvent: v.any(),
  }).index("by_webhook_id", ["webhookId"]),

  connectedAccounts: defineTable({
    teamId: v.string(),
    platform,
    providerAccountId: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("revoked"),
      v.literal("error"),
    ),
    capabilities: v.array(
      v.union(
        v.literal("text"),
        v.literal("image"),
        v.literal("video"),
        v.literal("carousel"),
        v.literal("analytics"),
        v.literal("inbox"),
      ),
    ),
    scopes: v.array(v.string()),
    encryptedAccessToken: v.optional(v.string()),
    encryptedRefreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    lastSyncedAt: v.optional(v.number()),
    connectedByUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_platform", ["teamId", "platform"])
    .index("by_provider_account", ["platform", "providerAccountId"]),

  mediaAssets: defineTable({
    teamId: v.string(),
    storageId: v.optional(v.id("_storage")),
    externalUrl: v.optional(v.string()),
    kind: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("document"),
    ),
    filename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    createdByUserId: v.string(),
    createdAt: v.number(),
  }).index("by_team", ["teamId"]),

  posts: defineTable({
    teamId: v.string(),
    createdByUserId: v.string(),
    updatedByUserId: v.optional(v.string()),
    title: v.optional(v.string()),
    body: v.string(),
    status: postStatus,
    scheduledFor: v.optional(v.number()),
    timezone: v.string(),
    mediaAssetIds: v.array(v.id("mediaAssets")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team_status", ["teamId", "status"])
    .index("by_team_schedule", ["teamId", "status", "scheduledFor"]),

  postTargets: defineTable({
    teamId: v.string(),
    postId: v.id("posts"),
    connectedAccountId: v.id("connectedAccounts"),
    platform,
    status: targetStatus,
    bodyOverride: v.optional(v.string()),
    firstComment: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    platformPostId: v.optional(v.string()),
    platformPermalink: v.optional(v.string()),
    failureCode: v.optional(v.string()),
    failureMessage: v.optional(v.string()),
    attempts: v.number(),
    metricSyncStatus,
    metricSyncError: v.optional(v.string()),
    lastMetricSyncAt: v.optional(v.number()),
    nextMetricSyncAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_team_status", ["teamId", "status"])
    .index("by_account_schedule", [
      "connectedAccountId",
      "status",
      "scheduledFor",
    ])
    .index("by_metric_sync", ["metricSyncStatus", "nextMetricSyncAt"]),

  postMetrics: defineTable({
    teamId: v.string(),
    postTargetId: v.id("postTargets"),
    capturedAt: v.number(),
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    shares: v.optional(v.number()),
    saves: v.optional(v.number()),
    clicks: v.optional(v.number()),
    views: v.optional(v.number()),
    impressions: v.optional(v.number()),
    reach: v.optional(v.number()),
    raw: v.optional(v.any()),
  })
    .index("by_target_time", ["postTargetId", "capturedAt"])
    .index("by_team_time", ["teamId", "capturedAt"]),

  inboxItems: defineTable({
    teamId: v.string(),
    connectedAccountId: v.id("connectedAccounts"),
    platform,
    kind: v.union(
      v.literal("comment"),
      v.literal("mention"),
      v.literal("message"),
    ),
    externalId: v.string(),
    authorName: v.string(),
    authorHandle: v.optional(v.string()),
    body: v.string(),
    status: v.union(v.literal("open"), v.literal("done"), v.literal("ignored")),
    receivedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team_status_time", ["teamId", "status", "receivedAt"])
    .index("by_account_external", ["connectedAccountId", "externalId"]),
});
