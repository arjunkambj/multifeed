import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { encryptSecret } from "./oauth/crypto";
import { targetClaimStatus } from "./schema";

const BATCH = 100;
const MAX_TARGETS_PER_POST = 100;
const MAX_MEDIA_PER_POST = 10;
const STALE_PUBLISH_MS = 12 * 60 * 1000;

async function loadTargets(ctx: MutationCtx, postId: Doc<"posts">["_id"]) {
  return await ctx.db
    .query("postTargets")
    .withIndex("by_post", (q) => q.eq("postId", postId))
    .take(MAX_TARGETS_PER_POST + 1);
}

async function scheduleTargets(ctx: MutationCtx, post: Doc<"posts">, now: number) {
  const targets = await loadTargets(ctx, post._id);
  if (targets.length === 0) {
    await ctx.db.patch("posts", post._id, { status: "published", updatedAt: now });
    return;
  }

  if (post.status !== "publishing") {
    await ctx.db.patch("posts", post._id, { status: "publishing", updatedAt: now });
  }

  for (const target of targets) {
    if (target.status === "published" || target.status === "skipped") continue;
    if (target.status === "failed") continue;
    if (
      target.status === "publishing" &&
      now - target.updatedAt < STALE_PUBLISH_MS
    ) {
      continue;
    }
    await ctx.scheduler.runAfter(0, internal.publishing.actions.publishOneTarget, {
      postId: post._id,
      targetId: target._id,
    });
  }
}

export const publishPost = internalMutation({
  args: { postId: v.id("posts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get("posts", args.postId);
    if (!post) return null;
    if (post.status === "published" || post.status === "archived") return null;
    if (post.status === "scheduled" && post.scheduledFor != null && post.scheduledFor > Date.now()) {
      return null;
    }
    await scheduleTargets(ctx, post, Date.now());
    return null;
  },
});

export const publishDuePosts = internalMutation({
  args: {},
  returns: v.object({ processed: v.number(), hasMore: v.boolean() }),
  handler: async (ctx) => {
    const now = Date.now();
    const scheduledDue = await ctx.db
      .query("posts")
      .withIndex("by_status_scheduledFor", (q) =>
        q.eq("status", "scheduled").lte("scheduledFor", now),
      )
      .take(BATCH);
    const publishingDue = await ctx.db
      .query("posts")
      .withIndex("by_status_scheduledFor", (q) =>
        q.eq("status", "publishing").lte("scheduledFor", now),
      )
      .take(BATCH);
    const dueMap = new Map<string, Doc<"posts">>();
    for (const post of scheduledDue) dueMap.set(post._id, post);
    for (const post of publishingDue) dueMap.set(post._id, post);
    const due = [...dueMap.values()].slice(0, BATCH);
    for (const post of due) {
      await scheduleTargets(ctx, post, now);
    }
    return { processed: due.length, hasMore: due.length === BATCH };
  },
});

export const getPostForPublish = internalQuery({
  args: { postId: v.id("posts") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => ctx.db.get("posts", args.postId),
});

export const getTargetForPublish = internalQuery({
  args: { targetId: v.id("postTargets") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => ctx.db.get("postTargets", args.targetId),
});

export const getAccountForPublish = internalQuery({
  args: { accountId: v.id("connectedAccounts") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => ctx.db.get("connectedAccounts", args.accountId),
});

export const getMediaAssetForPublish = internalQuery({
  args: { mediaAssetId: v.id("mediaAssets") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => ctx.db.get("mediaAssets", args.mediaAssetId),
});

export const getMediaForPost = internalQuery({
  args: { postId: v.id("posts") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("postMediaAssets")
      .withIndex("by_post_position", (q) => q.eq("postId", args.postId))
      .take(MAX_MEDIA_PER_POST + 1);
    const assets = await Promise.all(
      links.map((link) => ctx.db.get("mediaAssets", link.mediaAssetId)),
    );
    return assets.filter((asset): asset is Doc<"mediaAssets"> => asset !== null);
  },
});

export const claimTargetForPublish = internalMutation({
  args: { targetId: v.id("postTargets") },
  returns: targetClaimStatus,
  handler: async (ctx, args) => {
    const target = await ctx.db.get("postTargets", args.targetId);
    if (!target) return "missing";
    if (target.status === "published" || target.status === "skipped") return "done";
    const now = Date.now();
    if (
      target.status === "publishing" &&
      now - target.updatedAt < STALE_PUBLISH_MS
    ) {
      return "busy";
    }
    if (target.status === "failed") return "done";
    const hasAttempt = target.publishAttempt != null;
    if (target.status === "publishing" && hasAttempt) {
      await ctx.db.patch("postTargets", args.targetId, {
        attempts: target.attempts + 1,
        updatedAt: now,
      });
      return "resume";
    }
    if (target.status === "publishing") {
      await ctx.db.patch("postTargets", args.targetId, {
        status: "failed",
        failureCode: "stale_publish",
        failureMessage:
          "This publish timed out after the network may have already accepted it. Check the account before retrying.",
        publishAttempt: undefined,
        attempts: target.attempts + 1,
        updatedAt: now,
      });
      return "done";
    }
    await ctx.db.patch("postTargets", args.targetId, {
      status: "publishing",
      attempts: target.attempts + 1,
      failureCode: undefined,
      failureMessage: undefined,
      publishAttempt: undefined,
      updatedAt: now,
    });
    return "claimed";
  },
});

export const applyRefreshedToken = internalMutation({
  args: {
    accountId: v.id("connectedAccounts"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const account = await ctx.db.get("connectedAccounts", args.accountId);
    if (!account) return null;
    const now = Date.now();
    const patch: Partial<Doc<"connectedAccounts">> = {
      encryptedAccessToken: await encryptSecret(args.accessToken),
      tokenExpiresAt: args.expiresAt,
      status: "active",
      errorMessage: undefined,
      updatedAt: now,
    };
    if (args.refreshToken) {
      patch.encryptedRefreshToken = await encryptSecret(args.refreshToken);
      patch.refreshTokenExpiresAt = args.refreshTokenExpiresAt;
    }
    await ctx.db.patch("connectedAccounts", account._id, patch);
    return await ctx.db.get("connectedAccounts", account._id);
  },
});

export const markAccountExpired = internalMutation({
  args: { accountId: v.id("connectedAccounts"), errorMessage: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const account = await ctx.db.get("connectedAccounts", args.accountId);
    if (!account) return null;
    await ctx.db.patch("connectedAccounts", args.accountId, {
      status: "expired",
      errorMessage: args.errorMessage.slice(0, 1000),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const savePublishAttempt = internalMutation({
  args: {
    targetId: v.id("postTargets"),
    attempt: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const target = await ctx.db.get("postTargets", args.targetId);
    if (!target || target.status !== "publishing") return null;
    await ctx.db.patch("postTargets", args.targetId, {
      publishAttempt: args.attempt,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const markTargetPublished = internalMutation({
  args: {
    targetId: v.id("postTargets"),
    platformPostId: v.string(),
    permalink: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const target = await ctx.db.get("postTargets", args.targetId);
    if (!target || target.status === "published") return null;
    await ctx.db.patch("postTargets", args.targetId, {
      status: "published",
      publishedAt: Date.now(),
      platformPostId: args.platformPostId,
      platformPermalink: args.permalink,
      failureCode: undefined,
      failureMessage: undefined,
      publishAttempt: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const noteFirstCommentError = internalMutation({
  args: {
    targetId: v.id("postTargets"),
    firstCommentError: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const target = await ctx.db.get("postTargets", args.targetId);
    if (!target || target.status !== "published") return null;
    await ctx.db.patch("postTargets", args.targetId, {
      failureCode: "first_comment_failed",
      failureMessage: args.firstCommentError,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const markTargetFailed = internalMutation({
  args: {
    targetId: v.id("postTargets"),
    failureCode: v.string(),
    failureMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const target = await ctx.db.get("postTargets", args.targetId);
    if (!target || target.status === "published") return null;
    await ctx.db.patch("postTargets", args.targetId, {
      status: "failed",
      failureCode: args.failureCode,
      failureMessage: args.failureMessage,
      publishAttempt: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const reconcilePostStatus = internalMutation({
  args: { postId: v.id("posts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const targets = await loadTargets(ctx, args.postId);
    if (targets.length === 0) return null;
    const hasPublished = targets.some((target) => target.status === "published");
    const hasFailed = targets.some((target) => target.status === "failed");
    const hasPublishing = targets.some(
      (target) =>
        target.status === "publishing" ||
        target.status === "scheduled" ||
        target.status === "draft",
    );
    const status: Doc<"posts">["status"] = hasPublishing
      ? "publishing"
      : !hasPublished && hasFailed
        ? "failed"
        : "published";
    await ctx.db.patch("posts", args.postId, { status, updatedAt: Date.now() });
    return null;
  },
});

export const listAccountsForReadiness = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("connectedAccounts"),
      platform: v.string(),
      username: v.string(),
      status: v.string(),
      scopes: v.array(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db.query("connectedAccounts").take(50);
    return rows.map((account) => ({
      _id: account._id,
      platform: account.platform,
      username: account.username,
      status: account.status,
      scopes: account.scopes,
    }));
  },
});
