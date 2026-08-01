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
import { platformSettings, postKind, postStatus } from "./schema";

const targetInput = v.object({
  connectedAccountId: v.id("connectedAccounts"),
  bodyOverride: v.optional(v.string()),
  firstComment: v.optional(v.string()),
  referenceUrl: v.optional(v.string()),
  platformSettings: v.optional(platformSettings),
});

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
const CALENDAR_VISIBLE_STATUSES = [
  "scheduled",
  "publishing",
  "published",
  "failed",
] as const;
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
  const assets = await Promise.all(mediaAssetIds.map((id) => ctx.db.get(id)));
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
      input.targets.map((target) => ctx.db.get(target.connectedAccountId)),
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
    ...existing.map((row) => ctx.db.delete(row._id)),
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
    Promise.all(accountIds.map((id) => ctx.db.get(id))),
    Promise.all(mediaIds.map((id) => ctx.db.get(id))),
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
    status: v.optional(postStatus),
    mediaAssetIds: v.optional(v.array(v.id("mediaAssets"))),
    targets: v.optional(v.array(targetInput)),
    calendarColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post || post.teamId !== user.selectedTeamId) {
      throw new Error("Post not found");
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
    const status = args.status ?? post.status;
    let scheduledFor = post.scheduledFor;
    if (args.clearSchedule) scheduledFor = undefined;
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

    await ctx.db.patch(args.postId, {
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

    if (args.targets) {
      if (status !== "draft" && args.targets.length === 0) {
        throw new Error("Select at least one account");
      }
      await replaceTargets(ctx, {
        teamId: user.selectedTeamId,
        postId: args.postId,
        status: targetStatusFromPost(status),
        scheduledFor,
        targets: args.targets,
        kind,
        mediaAssets,
      });
    } else if (
      args.scheduledFor !== undefined ||
      args.clearSchedule ||
      args.status
    ) {
      const targets = await loadTargets(ctx, args.postId);
      await Promise.all(
        targets.map((target) =>
          ctx.db.patch(target._id, {
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
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post || post.teamId !== user.selectedTeamId) {
      throw new Error("Post not found");
    }

    const now = Date.now();
    if (args.scheduledFor < now - 60_000) {
      throw new Error("Scheduled time must be in the future");
    }

    const status =
      post.status === "draft" || post.status === "failed"
        ? "scheduled"
        : post.status === "published" || post.status === "publishing"
          ? post.status
          : "scheduled";

    if (status === "published") {
      throw new Error("Published posts cannot be rescheduled");
    }

    await ctx.db.patch(args.postId, {
      scheduledFor: args.scheduledFor,
      status: status === "publishing" ? "scheduled" : status,
      updatedByUserId: user.id,
      updatedAt: now,
    });

    const targets = await loadTargets(ctx, args.postId);
    await Promise.all(
      targets
        .filter((target) => target.status !== "published")
        .map((target) =>
          ctx.db.patch(target._id, {
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
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post || post.teamId !== user.selectedTeamId) {
      throw new Error("Post not found");
    }
    const targets = await loadTargets(ctx, args.postId);
    await Promise.all(targets.map((target) => ctx.db.delete(target._id)));
    await ctx.db.delete(args.postId);
    return { ok: true as const };
  },
});

export const get = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post || post.teamId !== user.selectedTeamId) return null;
    return enrichPost(ctx, post);
  },
});

export const list = query({
  args: {
    status: v.optional(postStatus),
    limit: v.optional(v.number()),
  },
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
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const [accounts, sourcePost] = await Promise.all([
      listAccountsForTeam(ctx, user.selectedTeamId),
      args.sourcePostId ? ctx.db.get(args.sourcePostId) : Promise.resolve(null),
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
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.endMs < args.startMs) return [];

    const posts = (
      await Promise.all(
        CALENDAR_VISIBLE_STATUSES.map((status) =>
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
      )
    )
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
