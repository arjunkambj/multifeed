import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { requireUser } from "./hexclave/auth";
import { listAccountsForTeam } from "./oauth/accounts";
import { platform as platformValidator, platformSettings, postKind, postStatus } from "./schema";
import { publicAccountValidator } from "./oauth/accounts";
import { mediaAssetOutputValidator } from "./media/r2";

const targetInput = v.object({
  connectedAccountId: v.id("connectedAccounts"),
  bodyOverride: v.optional(v.string()),
  firstComment: v.optional(v.string()),
  referenceUrl: v.optional(v.string()),
  platformSettings: v.optional(platformSettings),
});

const targetOutputValidator = v.object({
  targetId: v.id("postTargets"),
  connectedAccountId: v.id("connectedAccounts"),
  platform: platformValidator,
  status: v.union(
    v.literal("draft"),
    v.literal("scheduled"),
    v.literal("publishing"),
    v.literal("published"),
    v.literal("failed"),
    v.literal("skipped"),
  ),
  bodyOverride: v.optional(v.string()),
  firstComment: v.optional(v.string()),
  referenceUrl: v.optional(v.string()),
  platformSettings: v.optional(platformSettings),
  scheduledFor: v.optional(v.number()),
  platformPostId: v.optional(v.string()),
  platformPermalink: v.optional(v.string()),
  failureMessage: v.optional(v.string()),
  username: v.optional(v.string()),
  displayName: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
});

const enrichedPostValidator = v.object({
  _id: v.id("posts"),
  _creationTime: v.number(),
  teamId: v.string(),
  createdByUserId: v.string(),
  updatedByUserId: v.optional(v.string()),
  title: v.optional(v.string()),
  body: v.string(),
  kind: postKind,
  status: postStatus,
  scheduledFor: v.optional(v.number()),
  timezone: v.string(),
  mediaAssetIds: v.array(v.id("mediaAssets")),
  notes: v.optional(v.string()),
  calendarColor: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  targets: v.array(targetOutputValidator),
  mediaAssets: v.array(mediaAssetOutputValidator),
});

const editablePostStatus = v.union(
  v.literal("draft"),
  v.literal("scheduled"),
  v.literal("publishing"),
);

const CALENDAR_COLORS = [
  "#E85D04",
  "#1877F2",
  "#E4405F",
  "#0A66C2",
  "#111111",
  "#FF4500",
  "#7C3AED",
  "#059669",
];
const MAX_TARGETS_PER_POST = 100;
const OVERVIEW_TARGET_STATUSES = ["published", "failed"] as const;

const POST_KIND_PLATFORMS = {
  text: ["facebook", "linkedin", "threads", "x"],
  image: ["facebook", "instagram", "linkedin", "threads", "x", "tiktok"],
  video: [
    "facebook",
    "instagram",
    "threads",
    "tiktok",
    "youtube",
    "linkedin",
    "x",
  ],
  story: ["facebook", "instagram"],
} as const;

function colorForIndex(i: number) {
  return CALENDAR_COLORS[i % CALENDAR_COLORS.length]!;
}

async function loadTargets(ctx: QueryCtx | MutationCtx, postId: Id<"posts">) {
  const targets = await ctx.db
    .query("postTargets")
    .withIndex("by_post", (q) => q.eq("postId", postId))
    .take(MAX_TARGETS_PER_POST + 1);

  if (targets.length > MAX_TARGETS_PER_POST) {
    throw new Error(`Post exceeds the ${MAX_TARGETS_PER_POST} target limit`);
  }
  return targets;
}

async function assertMediaOwnedByTeam(
  ctx: MutationCtx,
  teamId: string,
  mediaAssetIds: Id<"mediaAssets">[] | undefined,
) {
  if (!mediaAssetIds?.length) return [];
  if (new Set(mediaAssetIds).size !== mediaAssetIds.length) {
    throw new Error("A media file can only be attached once per post");
  }
  const assets = await Promise.all(mediaAssetIds.map((id) => ctx.db.get("mediaAssets", id)));
  return assets.map((asset) => {
    if (!asset || asset.teamId !== teamId) {
      throw new Error("Invalid media asset");
    }
    if (asset.status !== "ready") {
      throw new Error("Media asset is not ready");
    }
    return asset;
  });
}

function validateMediaForKind(
  kind: Doc<"posts">["kind"],
  assets: Doc<"mediaAssets">[],
) {
  if (kind === "text") {
    if (assets.length > 0) throw new Error("Text posts cannot include media");
    return;
  }
  if (assets.length === 0) throw new Error(`Add media for this ${kind} post`);

  if (kind === "image") {
    if (assets.length > 10 || assets.some((asset) => asset.kind !== "image")) {
      throw new Error("Image posts support up to 10 images");
    }
    return;
  }

  if (assets.length !== 1) {
    throw new Error(
      `${kind === "story" ? "Stories" : "Videos"} need one media file`,
    );
  }
  if (kind === "video" && assets[0]?.kind !== "video") {
    throw new Error("Video posts need a video file");
  }
  if (kind === "story" && !["image", "video"].includes(assets[0]!.kind)) {
    throw new Error("Stories need an image or video");
  }
}

function accountSupportsKind(
  account: Doc<"connectedAccounts">,
  kind: Doc<"posts">["kind"],
  assets: Doc<"mediaAssets">[],
) {
  if (
    !POST_KIND_PLATFORMS[kind].some((platform) => platform === account.platform)
  ) {
    return false;
  }

  if (kind === "story") {
    const assetKind = assets[0]?.kind;
    const mediaKind =
      assetKind === "image" || assetKind === "video" ? assetKind : undefined;
    return mediaKind != null && account.capabilities.includes(mediaKind);
  }
  if (kind === "image" && assets.length > 1) {
    return account.capabilities.includes("carousel");
  }
  return account.capabilities.includes(kind);
}

type TargetInput = {
  connectedAccountId: Id<"connectedAccounts">;
  bodyOverride?: string;
  firstComment?: string;
  referenceUrl?: string;
  platformSettings?: Doc<"postTargets">["platformSettings"];
};

async function replaceTargets(
  ctx: MutationCtx,
  input: {
    teamId: string;
    postId: Id<"posts">;
    status: Doc<"postTargets">["status"];
    kind: Doc<"posts">["kind"];
    scheduledFor?: number;
    targets: TargetInput[];
    mediaAssets: Doc<"mediaAssets">[];
  },
) {
  if (input.targets.length > MAX_TARGETS_PER_POST) {
    throw new Error(`Posts support up to ${MAX_TARGETS_PER_POST} targets`);
  }
  if (
    new Set(input.targets.map((target) => target.connectedAccountId)).size !==
    input.targets.length
  ) {
    throw new Error("A connected account can only be targeted once per post");
  }

  const [existing, accounts] = await Promise.all([
    loadTargets(ctx, input.postId),
    Promise.all(
      input.targets.map((target) => ctx.db.get("connectedAccounts", target.connectedAccountId)),
    ),
  ]);
  const targetsWithAccounts = input.targets.map((target, index) => {
    const account = accounts[index];

    if (!account || account.teamId !== input.teamId) {
      throw new Error("Invalid connected account");
    }
    if (account.status !== "active") {
      throw new Error(
        `Account @${account.username} is ${account.status}. Reconnect it first.`,
      );
    }
    if (!accountSupportsKind(account, input.kind, input.mediaAssets)) {
      throw new Error(
        `${account.username} does not support this ${input.kind} post`,
      );
    }
    return { account, target };
  });

  const now = Date.now();
  await Promise.all([
    ...existing.map((row) => ctx.db.delete("postTargets", row._id)),
    ...targetsWithAccounts.map(({ account, target }) =>
      ctx.db.insert("postTargets", {
        teamId: input.teamId,
        postId: input.postId,
        connectedAccountId: target.connectedAccountId,
        platform: account.platform,
        status: input.status,
        bodyOverride: target.bodyOverride,
        firstComment: target.firstComment,
        referenceUrl: target.referenceUrl,
        platformSettings: target.platformSettings,
        scheduledFor: input.scheduledFor,
        attempts: 0,
        metricSyncStatus: "idle",
        updatedAt: now,
      }),
    ),
  ]);
}

function targetStatusFromPost(
  status: Doc<"posts">["status"],
): Doc<"postTargets">["status"] {
  if (status === "archived") return "skipped";
  return status;
}

async function enrichPosts(ctx: QueryCtx, posts: Doc<"posts">[]) {
  const targetsByPost = await Promise.all(
    posts.map((post) => loadTargets(ctx, post._id)),
  );
  const accountIds = [
    ...new Set(
      targetsByPost.flatMap((targets) =>
        targets.map((target) => target.connectedAccountId),
      ),
    ),
  ];
  const mediaIds = [...new Set(posts.flatMap((post) => post.mediaAssetIds))];
  const [accounts, mediaAssets] = await Promise.all([
    Promise.all(accountIds.map((id) => ctx.db.get("connectedAccounts", id))),
    Promise.all(mediaIds.map((id) => ctx.db.get("mediaAssets", id))),
  ]);
  const accountsById = new Map(
    accounts.flatMap((account) => (account ? [[account._id, account]] : [])),
  );
  const mediaById = new Map(
    mediaAssets.flatMap((asset) => (asset ? [[asset._id, asset]] : [])),
  );

  return posts.map((post, index) => ({
    ...post,
    targets: (targetsByPost[index] ?? []).map((target) => {
      const account = accountsById.get(target.connectedAccountId);
      return {
        targetId: target._id,
        connectedAccountId: target.connectedAccountId,
        platform: target.platform,
        status: target.status,
        bodyOverride: target.bodyOverride,
        firstComment: target.firstComment,
        referenceUrl: target.referenceUrl,
        platformSettings: target.platformSettings,
        scheduledFor: target.scheduledFor,
        platformPostId: target.platformPostId,
        platformPermalink: target.platformPermalink,
        failureMessage: target.failureMessage,
        username: account?.username,
        displayName: account?.displayName,
        avatarUrl: account?.avatarUrl,
      };
    }),
    mediaAssets: post.mediaAssetIds.flatMap((id) => {
      const asset = mediaById.get(id);
      return asset ? [asset] : [];
    }),
  }));
}

async function enrichPost(ctx: QueryCtx, post: Doc<"posts">) {
  return (await enrichPosts(ctx, [post]))[0]!;
}

/**
 * Create draft, scheduled, or "post now" (queued as scheduled immediately).
 * Until a publisher worker exists, "publishing" is stored as scheduled@now
 * so the post appears on the calendar and scheduled list.
 */
export const create = mutation({
  args: {
    title: v.optional(v.string()),
    body: v.string(),
    kind: postKind,
    notes: v.optional(v.string()),
    timezone: v.string(),
    scheduledFor: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("publishing"),
    ),
    mediaAssetIds: v.optional(v.array(v.id("mediaAssets"))),
    targets: v.array(targetInput),
    calendarColor: v.optional(v.string()),
  },
  returns: v.object({ postId: v.id("posts") }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    if (args.kind === "text" && !args.body.trim()) {
      throw new Error("Add text before saving");
    }

    const mediaAssets = await assertMediaOwnedByTeam(
      ctx,
      user.selectedTeamId,
      args.mediaAssetIds,
    );
    validateMediaForKind(args.kind, mediaAssets);

    // "Post now" → schedule for immediate publish once a worker exists.
    // Storing as `scheduled` keeps the post visible in list/calendar UIs.
    const status = args.status === "publishing" ? "scheduled" : args.status;
    let scheduledFor = args.scheduledFor;

    if (args.status === "publishing") {
      scheduledFor = now;
    } else if (args.status === "scheduled") {
      if (!scheduledFor) {
        throw new Error("Pick a date and time to schedule");
      }
      if (scheduledFor < now - 60_000) {
        throw new Error("Scheduled time must be in the future");
      }
    }

    if (status !== "draft" && args.targets.length === 0) {
      throw new Error("Select at least one account");
    }

    if (status !== "draft" && scheduledFor == null) {
      scheduledFor = now;
    }

    const postId = await ctx.db.insert("posts", {
      teamId: user.selectedTeamId,
      createdByUserId: user.id,
      title: args.title?.trim() || undefined,
      body: args.body,
      kind: args.kind,
      notes: args.notes?.trim() || undefined,
      status,
      scheduledFor: status === "draft" ? args.scheduledFor : scheduledFor,
      timezone: args.timezone,
      mediaAssetIds: args.mediaAssetIds ?? [],
      calendarColor: args.calendarColor ?? colorForIndex(now % 8),
      createdAt: now,
      updatedAt: now,
    });

    if (args.targets.length > 0) {
      await replaceTargets(ctx, {
        teamId: user.selectedTeamId,
        postId,
        status: targetStatusFromPost(status),
        scheduledFor: status === "draft" ? args.scheduledFor : scheduledFor,
        targets: args.targets,
        kind: args.kind,
        mediaAssets,
      });
    }

    return { postId };
  },
});

export const update = mutation({
  args: {
    postId: v.id("posts"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    kind: v.optional(postKind),
    notes: v.optional(v.string()),
    timezone: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    clearSchedule: v.optional(v.boolean()),
    status: v.optional(editablePostStatus),
    mediaAssetIds: v.optional(v.array(v.id("mediaAssets"))),
    targets: v.optional(v.array(targetInput)),
    calendarColor: v.optional(v.string()),
  },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get("posts", args.postId);
    if (!post || post.teamId !== user.selectedTeamId) {
      throw new Error("Post not found");
    }
    if (
      post.status === "publishing" ||
      post.status === "published" ||
      post.status === "archived"
    ) {
      throw new Error("This post can no longer be edited");
    }

    const kind = args.kind ?? post.kind;
    const mediaAssetIds = args.mediaAssetIds ?? post.mediaAssetIds;
    const mediaAssets = await assertMediaOwnedByTeam(
      ctx,
      user.selectedTeamId,
      mediaAssetIds,
    );
    validateMediaForKind(kind, mediaAssets);
    const body = args.body ?? post.body;
    if (kind === "text" && !body.trim()) {
      throw new Error("Add text before saving");
    }

    const now = Date.now();
    const requestedStatus = args.status ?? post.status;
    const status =
      requestedStatus === "publishing" ? "scheduled" : requestedStatus;
    let scheduledFor = post.scheduledFor;
    if (requestedStatus === "publishing") scheduledFor = now;
    else if (args.clearSchedule) scheduledFor = undefined;
    else if (args.scheduledFor !== undefined) scheduledFor = args.scheduledFor;

    if (status === "scheduled" && !scheduledFor) {
      throw new Error("Scheduled posts need a date and time");
    }

    if (
      status === "scheduled" &&
      scheduledFor != null &&
      scheduledFor < now - 60_000
    ) {
      throw new Error("Scheduled time must be in the future");
    }

    const storedTargets =
      args.targets === undefined
        ? await loadTargets(ctx, args.postId)
        : undefined;
    if (
      status !== "draft" &&
      (args.targets ?? storedTargets ?? []).length === 0
    ) {
      throw new Error("Select at least one account");
    }

    await ctx.db.patch("posts", args.postId, {
      title:
        args.title !== undefined ? args.title.trim() || undefined : post.title,
      body: args.body ?? post.body,
      kind,
      notes:
        args.notes !== undefined ? args.notes.trim() || undefined : post.notes,
      timezone: args.timezone ?? post.timezone,
      scheduledFor,
      status,
      mediaAssetIds,
      calendarColor: args.calendarColor ?? post.calendarColor,
      updatedByUserId: user.id,
      updatedAt: now,
    });

    const shouldReplaceTargets =
      args.targets !== undefined ||
      args.kind !== undefined ||
      args.mediaAssetIds !== undefined;

    if (shouldReplaceTargets) {
      const targets =
        args.targets ??
        storedTargets!.map((target) => ({
          connectedAccountId: target.connectedAccountId,
          bodyOverride: target.bodyOverride,
          firstComment: target.firstComment,
          referenceUrl: target.referenceUrl,
          platformSettings: target.platformSettings,
        }));

      await replaceTargets(ctx, {
        teamId: user.selectedTeamId,
        postId: args.postId,
        status: targetStatusFromPost(status),
        scheduledFor,
        targets,
        kind,
        mediaAssets,
      });
    } else if (
      args.scheduledFor !== undefined ||
      args.clearSchedule ||
      args.status
    ) {
      const targets = storedTargets!;
      await Promise.all(
        targets.map((target) =>
          ctx.db.patch("postTargets", target._id, {
            status: targetStatusFromPost(status),
            scheduledFor,
            updatedAt: now,
          }),
        ),
      );
    }

    return { ok: true as const };
  },
});

/** Reschedule from calendar drag/drop. */
export const reschedule = mutation({
  args: {
    postId: v.id("posts"),
    scheduledFor: v.number(),
  },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get("posts", args.postId);
    if (!post || post.teamId !== user.selectedTeamId) {
      throw new Error("Post not found");
    }

    if (
      post.status === "publishing" ||
      post.status === "published" ||
      post.status === "archived"
    ) {
      throw new Error("This post can no longer be rescheduled");
    }

    const now = Date.now();
    if (args.scheduledFor < now - 60_000) {
      throw new Error("Scheduled time must be in the future");
    }

    const status = "scheduled" as const;

    await ctx.db.patch("posts", args.postId, {
      scheduledFor: args.scheduledFor,
      status,
      updatedByUserId: user.id,
      updatedAt: now,
    });

    const targets = await loadTargets(ctx, args.postId);
    await Promise.all(
      targets
        .filter((target) => target.status !== "published")
        .map((target) =>
          ctx.db.patch("postTargets", target._id, {
            scheduledFor: args.scheduledFor,
            status: "scheduled",
            updatedAt: now,
          }),
        ),
    );

    return { ok: true as const };
  },
});

export const remove = mutation({
  args: { postId: v.id("posts") },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get("posts", args.postId);
    if (!post || post.teamId !== user.selectedTeamId) {
      throw new Error("Post not found");
    }
    if (post.status === "publishing") {
      throw new Error("A post being published cannot be deleted");
    }
    const targets = await loadTargets(ctx, args.postId);
    const metricSnapshots = await Promise.all(
      targets.map((target) =>
        ctx.db
          .query("postMetrics")
          .withIndex("by_target_time", (q) => q.eq("postTargetId", target._id))
          .first(),
      ),
    );
    if (metricSnapshots.some(Boolean)) {
      throw new Error("Posts with analytics history cannot be deleted");
    }
    await Promise.all(targets.map((target) => ctx.db.delete("postTargets", target._id)));
    await ctx.db.delete("posts", args.postId);
    return { ok: true as const };
  },
});

export const get = query({
  args: { postId: v.id("posts") },
  returns: v.union(enrichedPostValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get("posts", args.postId);
    if (!post || post.teamId !== user.selectedTeamId) return null;
    return enrichPost(ctx, post);
  },
});

export const list = query({
  args: {
    status: v.optional(postStatus),
    limit: v.optional(v.number()),
  },
  returns: v.array(enrichedPostValidator),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = Math.max(1, Math.min(args.limit ?? 50, 100));

    let posts: Doc<"posts">[];
    if (args.status) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_team_status", (q) =>
          q.eq("teamId", user.selectedTeamId).eq("status", args.status!),
        )
        .order("desc")
        .take(limit);
    } else {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_team_updated", (q) =>
          q.eq("teamId", user.selectedTeamId),
        )
        .order("desc")
        .take(limit);
    }

    return await enrichPosts(ctx, posts);
  },
});

/** Small, bounded payload for the composer's optional caption-history tool. */
export const recentCaptions = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = Math.max(1, Math.min(args.limit ?? 50, 100));
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_team_updated", (q) => q.eq("teamId", user.selectedTeamId))
      .order("desc")
      .take(limit);

    return posts.flatMap((post) => {
      const body = post.body.trim();
      return body ? [body] : [];
    });
  },
});

/** One subscription for the account picker and optional source post. */
export const composerData = query({
  args: { sourcePostId: v.optional(v.id("posts")) },
  returns: v.object({
    accounts: v.array(publicAccountValidator),
    sourcePost: v.union(enrichedPostValidator, v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const [accounts, sourcePost] = await Promise.all([
      listAccountsForTeam(ctx, user.selectedTeamId),
      args.sourcePostId ? ctx.db.get("posts", args.sourcePostId) : Promise.resolve(null),
    ]);

    return {
      accounts,
      sourcePost:
        sourcePost?.teamId === user.selectedTeamId
          ? await enrichPost(ctx, sourcePost)
          : null,
    };
  },
});

/** Calendar range: posts with scheduledFor in [startMs, endMs]. */
export const listInRange = query({
  args: {
    startMs: v.number(),
    endMs: v.number(),
  },
  returns: v.array(enrichedPostValidator),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.endMs < args.startMs) return [];

    const visibleStatuses: Doc<"posts">["status"][] = [
      "scheduled",
      "publishing",
      "published",
      "failed",
    ];
    const postsByStatus = await Promise.all(
      visibleStatuses.map((status) =>
        ctx.db
          .query("posts")
          .withIndex("by_team_schedule", (q) =>
            q
              .eq("teamId", user.selectedTeamId)
              .eq("status", status)
              .gte("scheduledFor", args.startMs)
              .lte("scheduledFor", args.endMs),
          )
          .take(500),
      ),
    );

    const posts = postsByStatus
      .flat()
      .sort((a, b) => (a.scheduledFor ?? 0) - (b.scheduledFor ?? 0))
      .slice(0, 500);

    return await enrichPosts(ctx, posts);
  },
});

/** Overview KPIs for scheduled publishing activity in a selected date range. */
export const overviewMetrics = query({
  args: {
    startMs: v.number(),
    endMs: v.number(),
  },
  returns: v.object({
    scheduledPosts: v.number(),
    previousScheduledPosts: v.number(),
    publishedPosts: v.number(),
    previousPublishedPosts: v.number(),
    publishingSuccessRate: v.number(),
    previousPublishingSuccessRate: v.number(),
    engagement: v.number(),
    previousEngagement: v.number(),
    activeChannels: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.endMs < args.startMs) {
      throw new Error("End date must be after start date");
    }

    const durationMs = args.endMs - args.startMs + 1;
    const previousEndMs = args.startMs - 1;
    const previousStartMs = previousEndMs - durationMs + 1;
    const combinedStartMs = previousStartMs;
    const teamId = user.selectedTeamId;

    const [posts, targets, metricSnapshots, activeAccounts] = await Promise.all(
      [
        ctx.db
          .query("posts")
          .withIndex("by_team_scheduledFor", (q) =>
            q
              .eq("teamId", teamId)
              .gte("scheduledFor", combinedStartMs)
              .lte("scheduledFor", args.endMs),
          )
          .take(2_000),
        Promise.all(
          OVERVIEW_TARGET_STATUSES.map((status) =>
            ctx.db
              .query("postTargets")
              .withIndex("by_team_status_scheduledFor", (q) =>
                q
                  .eq("teamId", teamId)
                  .eq("status", status)
                  .gte("scheduledFor", combinedStartMs)
                  .lte("scheduledFor", args.endMs),
              )
              .take(5_000),
          ),
        ).then((rows) => rows.flat()),
        ctx.db
          .query("postMetrics")
          .withIndex("by_team_time", (q) =>
            q
              .eq("teamId", teamId)
              .gte("capturedAt", combinedStartMs)
              .lte("capturedAt", args.endMs),
          )
          .take(5_000),
        ctx.db
          .query("connectedAccounts")
          .withIndex("by_team_status", (q) =>
            q.eq("teamId", teamId).eq("status", "active"),
          )
          .take(250),
      ],
    );

    const inCurrentRange = (timestamp: number | undefined) =>
      timestamp != null && timestamp >= args.startMs && timestamp <= args.endMs;
    const inPreviousRange = (timestamp: number | undefined) =>
      timestamp != null &&
      timestamp >= previousStartMs &&
      timestamp <= previousEndMs;

    const summarizePosts = (isInRange: typeof inCurrentRange) => {
      const rangePosts = posts.filter((post) => isInRange(post.scheduledFor));
      return {
        scheduled: rangePosts.filter((post) =>
          ["scheduled", "publishing"].includes(post.status),
        ).length,
        published: rangePosts.filter((post) => post.status === "published")
          .length,
      };
    };

    const summarizeTargets = (isInRange: typeof inCurrentRange) => {
      const rangeTargets = targets.filter((target) =>
        isInRange(target.scheduledFor),
      );
      const published = rangeTargets.filter(
        (target) => target.status === "published",
      ).length;
      const failed = rangeTargets.filter(
        (target) => target.status === "failed",
      ).length;
      const completed = published + failed;
      return {
        successRate: completed === 0 ? 0 : (published / completed) * 100,
      };
    };

    const summarizeEngagement = (isInRange: typeof inCurrentRange) => {
      const latestByTarget = new Map<
        Id<"postTargets">,
        (typeof metricSnapshots)[number]
      >();
      for (const snapshot of metricSnapshots) {
        if (!isInRange(snapshot.capturedAt)) continue;
        const previous = latestByTarget.get(snapshot.postTargetId);
        if (!previous || previous.capturedAt < snapshot.capturedAt) {
          latestByTarget.set(snapshot.postTargetId, snapshot);
        }
      }
      return [...latestByTarget.values()].reduce(
        (total, snapshot) =>
          total +
          (snapshot.likes ?? 0) +
          (snapshot.comments ?? 0) +
          (snapshot.shares ?? 0) +
          (snapshot.saves ?? 0),
        0,
      );
    };

    const currentPosts = summarizePosts(inCurrentRange);
    const previousPosts = summarizePosts(inPreviousRange);
    const currentTargets = summarizeTargets(inCurrentRange);
    const previousTargets = summarizeTargets(inPreviousRange);

    return {
      scheduledPosts: currentPosts.scheduled,
      previousScheduledPosts: previousPosts.scheduled,
      publishedPosts: currentPosts.published,
      previousPublishedPosts: previousPosts.published,
      publishingSuccessRate: currentTargets.successRate,
      previousPublishingSuccessRate: previousTargets.successRate,
      engagement: summarizeEngagement(inCurrentRange),
      previousEngagement: summarizeEngagement(inPreviousRange),
      activeChannels: new Set(activeAccounts.map((account) => account.platform))
        .size,
    };
  },
});

export const listScheduled = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(enrichedPostValidator),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = Math.max(1, Math.min(args.limit ?? 40, 100));
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_team_status", (q) =>
        q.eq("teamId", user.selectedTeamId).eq("status", "scheduled"),
      )
      .order("desc")
      .take(limit);

    return await enrichPosts(ctx, posts);
  },
});
