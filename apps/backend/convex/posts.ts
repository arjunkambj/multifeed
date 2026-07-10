import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { requireUser } from "./hexclave/auth";
import { platform as platformValidator } from "./schema";

const postStatus = v.union(
  v.literal("draft"),
  v.literal("scheduled"),
  v.literal("publishing"),
  v.literal("published"),
  v.literal("failed"),
  v.literal("archived"),
);

const targetInput = v.object({
  connectedAccountId: v.id("connectedAccounts"),
  bodyOverride: v.optional(v.string()),
  firstComment: v.optional(v.string()),
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

function colorForIndex(i: number) {
  return CALENDAR_COLORS[i % CALENDAR_COLORS.length]!;
}

async function loadTargets(ctx: QueryCtx | MutationCtx, postId: Id<"posts">) {
  return await ctx.db
    .query("postTargets")
    .withIndex("by_post", (q) => q.eq("postId", postId))
    .collect();
}

async function assertMediaOwnedByTeam(
  ctx: MutationCtx,
  teamId: string,
  mediaAssetIds: Id<"mediaAssets">[] | undefined,
) {
  if (!mediaAssetIds?.length) return;
  for (const id of mediaAssetIds) {
    const asset = await ctx.db.get(id);
    if (!asset || asset.teamId !== teamId) {
      throw new Error("Invalid media asset");
    }
    if (asset.status !== "ready") {
      throw new Error("Media asset is not ready");
    }
  }
}

async function replaceTargets(
  ctx: MutationCtx,
  input: {
    teamId: string;
    postId: Id<"posts">;
    status: Doc<"postTargets">["status"];
    scheduledFor?: number;
    targets: Array<{
      connectedAccountId: Id<"connectedAccounts">;
      bodyOverride?: string;
      firstComment?: string;
    }>;
  },
) {
  const existing = await loadTargets(ctx, input.postId);
  for (const row of existing) {
    await ctx.db.delete(row._id);
  }

  const now = Date.now();
  for (const target of input.targets) {
    const account = await ctx.db.get(target.connectedAccountId);
    if (!account || account.teamId !== input.teamId) {
      throw new Error("Invalid connected account");
    }
    if (account.status !== "active") {
      throw new Error(
        `Account @${account.username} is ${account.status}. Reconnect it first.`,
      );
    }

    await ctx.db.insert("postTargets", {
      teamId: input.teamId,
      postId: input.postId,
      connectedAccountId: target.connectedAccountId,
      platform: account.platform,
      status: input.status,
      bodyOverride: target.bodyOverride,
      firstComment: target.firstComment,
      scheduledFor: input.scheduledFor,
      attempts: 0,
      metricSyncStatus: "idle",
      updatedAt: now,
    });
  }
}

function targetStatusFromPost(
  status: Doc<"posts">["status"],
): Doc<"postTargets">["status"] {
  if (status === "archived") return "skipped";
  return status;
}

async function enrichPost(ctx: QueryCtx, post: Doc<"posts">) {
  const targets = await loadTargets(ctx, post._id);
  const accounts = await Promise.all(
    targets.map(async (t) => {
      const account = await ctx.db.get(t.connectedAccountId);
      return {
        targetId: t._id,
        connectedAccountId: t.connectedAccountId,
        platform: t.platform,
        status: t.status,
        bodyOverride: t.bodyOverride,
        firstComment: t.firstComment,
        scheduledFor: t.scheduledFor,
        platformPostId: t.platformPostId,
        platformPermalink: t.platformPermalink,
        failureMessage: t.failureMessage,
        username: account?.username,
        displayName: account?.displayName,
        avatarUrl: account?.avatarUrl,
      };
    }),
  );

  return {
    ...post,
    targets: accounts,
  };
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

    if (!args.body.trim() && (args.mediaAssetIds?.length ?? 0) === 0) {
      throw new Error("Add a caption or media before saving");
    }

    await assertMediaOwnedByTeam(
      ctx,
      user.selectedTeamId,
      args.mediaAssetIds,
    );

    // "Post now" → schedule for immediate publish once a worker exists.
    // Storing as `scheduled` keeps the post visible in list/calendar UIs.
    let status: Doc<"posts">["status"] = args.status;
    let scheduledFor = args.scheduledFor;

    if (args.status === "publishing") {
      status = "scheduled";
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

    if (status === "draft") {
      // keep optional scheduledFor on drafts
    } else if (scheduledFor == null) {
      scheduledFor = now;
    }

    const postId = await ctx.db.insert("posts", {
      teamId: user.selectedTeamId,
      createdByUserId: user.id,
      title: args.title?.trim() || undefined,
      body: args.body,
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

    if (args.mediaAssetIds !== undefined) {
      await assertMediaOwnedByTeam(
        ctx,
        user.selectedTeamId,
        args.mediaAssetIds,
      );
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
      title: args.title !== undefined ? args.title.trim() || undefined : post.title,
      body: args.body ?? post.body,
      notes:
        args.notes !== undefined
          ? args.notes.trim() || undefined
          : post.notes,
      timezone: args.timezone ?? post.timezone,
      scheduledFor,
      status,
      mediaAssetIds: args.mediaAssetIds ?? post.mediaAssetIds,
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
      });
    } else if (
      args.scheduledFor !== undefined ||
      args.clearSchedule ||
      args.status
    ) {
      const targets = await loadTargets(ctx, args.postId);
      for (const t of targets) {
        await ctx.db.patch(t._id, {
          status: targetStatusFromPost(status),
          scheduledFor,
          updatedAt: now,
        });
      }
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
    for (const t of targets) {
      if (t.status === "published") continue;
      await ctx.db.patch(t._id, {
        scheduledFor: args.scheduledFor,
        status: "scheduled",
        updatedAt: now,
      });
    }

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
    for (const t of targets) await ctx.db.delete(t._id);
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
    const limit = Math.min(args.limit ?? 50, 100);

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

    return await Promise.all(posts.map((p) => enrichPost(ctx, p)));
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

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_team_scheduledFor", (q) =>
        q
          .eq("teamId", user.selectedTeamId)
          .gte("scheduledFor", args.startMs)
          .lte("scheduledFor", args.endMs),
      )
      .take(500);

    const enriched = await Promise.all(posts.map((p) => enrichPost(ctx, p)));
    return enriched.filter(
      (p) => p.status !== "archived" && p.status !== "draft",
    );
  },
});

export const listScheduled = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = Math.min(args.limit ?? 40, 100);
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_team_status", (q) =>
        q.eq("teamId", user.selectedTeamId).eq("status", "scheduled"),
      )
      .order("desc")
      .take(limit);

    return await Promise.all(posts.map((p) => enrichPost(ctx, p)));
  },
});

// keep platform validator referenced for future filters
void platformValidator;
