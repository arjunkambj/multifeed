import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { decryptSecret } from "./oauth/crypto";

const BATCH = 100;

async function refreshAccessTokenForPlatform(
  platform: string,
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: number; refreshTokenExpiresAt?: number } | null> {
  const tryFetch = async (url: string, init: RequestInit) => {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
    const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, j };
  };
  if (platform === "x") {
    const id = process.env.X_CLIENT_ID;
    const secret = process.env.X_CLIENT_SECRET;
    if (!id) return null;
    const body = new URLSearchParams({ refresh_token: refreshToken, grant_type: "refresh_token" });
    if (!secret) body.set("client_id", id);
    const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
    if (secret) headers.Authorization = `Basic ${btoa(`${id}:${secret}`)}`;
    const { ok, j } = await tryFetch("https://api.x.com/2/oauth2/token", { method: "POST", headers, body });
    if (!ok || !j.access_token) return null;
    return { accessToken: j.access_token as string, refreshToken: (j.refresh_token as string) ?? refreshToken, expiresAt: j.expires_in ? Date.now() + (j.expires_in as number) * 1000 : undefined };
  }
  if (platform === "linkedin") {
    const id = process.env.LINKEDIN_CLIENT_ID;
    const secret = process.env.LINKEDIN_CLIENT_SECRET;
    if (!id || !secret) return null;
    const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: id, client_secret: secret });
    const { ok, j } = await tryFetch("https://www.linkedin.com/oauth/v2/accessToken", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (!ok || !j.access_token) return null;
    return { accessToken: j.access_token as string, refreshToken: (j.refresh_token as string) ?? refreshToken, expiresAt: j.expires_in ? Date.now() + (j.expires_in as number) * 1000 : undefined, refreshTokenExpiresAt: j.refresh_token_expires_in ? Date.now() + (j.refresh_token_expires_in as number) * 1000 : undefined };
  }
  if (platform === "youtube") {
    const id = process.env.GOOGLE_CLIENT_ID;
    const secret = process.env.GOOGLE_CLIENT_SECRET;
    if (!id || !secret) return null;
    const body = new URLSearchParams({ client_id: id, client_secret: secret, refresh_token: refreshToken, grant_type: "refresh_token" });
    const { ok, j } = await tryFetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (!ok || !j.access_token) return null;
    return { accessToken: j.access_token as string, refreshToken, expiresAt: j.expires_in ? Date.now() + (j.expires_in as number) * 1000 : undefined };
  }
  if (platform === "tiktok") {
    const key = process.env.TIKTOK_CLIENT_KEY;
    const secret = process.env.TIKTOK_CLIENT_SECRET;
    if (!key || !secret) return null;
    const body = new URLSearchParams({ client_key: key, client_secret: secret, grant_type: "refresh_token", refresh_token: refreshToken });
    const { ok, j } = await tryFetch("https://open.tiktokapis.com/v2/oauth/token/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (!ok || !j.access_token) return null;
    return { accessToken: j.access_token as string, refreshToken: (j.refresh_token as string) ?? refreshToken, expiresAt: j.expires_in ? Date.now() + (j.expires_in as number) * 1000 : undefined, refreshTokenExpiresAt: j.refresh_expires_in ? Date.now() + (j.refresh_expires_in as number) * 1000 : undefined };
  }
  if (platform === "threads") {
    const { ok, j } = await tryFetch(`https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${encodeURIComponent(refreshToken)}`, {});
    if (!ok || !j.access_token) return null;
    return { accessToken: j.access_token as string, expiresAt: j.expires_in ? Date.now() + (j.expires_in as number) * 1000 : undefined };
  }
  if (platform === "facebook" || platform === "instagram") {
    const id = process.env.FACEBOOK_APP_ID ?? process.env.META_APP_ID;
    const secret = process.env.FACEBOOK_APP_SECRET ?? process.env.META_APP_SECRET;
    if (!id || !secret) return null;
    const { ok, j } = await tryFetch(
      `https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(id)}&client_secret=${encodeURIComponent(secret)}&fb_exchange_token=${encodeURIComponent(refreshToken)}`,
      { method: "GET" },
    );
    if (!ok || !j.access_token) return null;
    return { accessToken: j.access_token as string, expiresAt: j.expires_in ? Date.now() + (j.expires_in as number) * 1000 : undefined };
  }
  return null;
}

export const publishPost = internalMutation({
  args: { postId: v.id("posts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get("posts", args.postId);
    if (!post) return null;
    if (post.status === "published" || post.status === "archived" || post.status === "failed") return null;
    if (post.status === "scheduled" && post.scheduledFor != null && post.scheduledFor > Date.now()) return null;
    const targets = await ctx.db.query("postTargets").withIndex("by_post", (q) => q.eq("postId", post._id)).collect();
    if (targets.length === 0) {
      await ctx.db.patch("posts", post._id, { status: "published", updatedAt: Date.now() });
      return null;
    }
    if (post.status !== "publishing") {
      await ctx.db.patch("posts", post._id, { status: "publishing", updatedAt: Date.now() });
      for (const t of targets) if (t.status === "scheduled") await ctx.db.patch("postTargets", t._id, { status: "publishing", updatedAt: Date.now() });
    }
    for (const target of targets) {
      if (target.status === "published" || target.status === "skipped") continue;
      await ctx.scheduler.runAfter(0, internal.publishing.actions.publishOneTarget, { postId: post._id, targetId: target._id });
    }
    return null;
  },
});

export const publishDuePosts = internalMutation({
  args: {},
  returns: v.object({ processed: v.number(), hasMore: v.boolean() }),
  handler: async (ctx) => {
    const now = Date.now();
    const scheduledDue = await ctx.db.query("posts").withIndex("by_status_scheduledFor", (q) => q.eq("status", "scheduled").lte("scheduledFor", now)).take(BATCH);
    const publishingDue = await ctx.db.query("posts").withIndex("by_status_scheduledFor", (q) => q.eq("status", "publishing").lte("scheduledFor", now)).take(BATCH);
    const dueMap = new Map<string, Doc<"posts">>();
    for (const p of [...scheduledDue, ...publishingDue]) dueMap.set(p._id, p);
    const due = [...dueMap.values()].slice(0, BATCH);
    for (const post of due) {
      const alreadyPublishing = post.status === "publishing";
      if (!alreadyPublishing) {
        await ctx.db.patch("posts", post._id, { status: "publishing", updatedAt: now });
        const tgs = await ctx.db.query("postTargets").withIndex("by_post", (q) => q.eq("postId", post._id)).collect();
        for (const tg of tgs) if (tg.status === "scheduled") await ctx.db.patch("postTargets", tg._id, { status: "publishing", updatedAt: now });
      }
      const tgs = await ctx.db.query("postTargets").withIndex("by_post", (q) => q.eq("postId", post._id)).collect();
      for (const tg of tgs) if (tg.status !== "published" && tg.status !== "skipped" && tg.status !== "failed") await ctx.scheduler.runAfter(0, internal.publishing.actions.publishOneTarget, { postId: post._id, targetId: tg._id });
    }
    return { processed: due.length, hasMore: due.length === BATCH };
  },
});

export const getPostForPublish = internalMutation({
  args: { postId: v.id("posts") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => ctx.db.get("posts", args.postId),
});
export const getTargetForPublish = internalMutation({
  args: { targetId: v.id("postTargets") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => ctx.db.get("postTargets", args.targetId),
});
export const getAccountForPublish = internalMutation({
  args: { accountId: v.id("connectedAccounts") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => ctx.db.get("connectedAccounts", args.accountId),
});
export const getMediaForPost = internalMutation({
  args: { postId: v.id("posts") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const links = await ctx.db.query("postMediaAssets").withIndex("by_post_position", (q) => q.eq("postId", args.postId)).collect();
    const assets = await Promise.all(links.map((l) => ctx.db.get("mediaAssets", l.mediaAssetId)));
    return assets.filter((a): a is Doc<"mediaAssets"> => a !== null) as unknown as Array<unknown>;
  },
});
export const ensureFreshToken = internalMutation({
  args: { accountId: v.id("connectedAccounts") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args): Promise<Doc<"connectedAccounts"> | null> => {
    const account = await ctx.db.get("connectedAccounts", args.accountId);
    if (!account) return null;
    const now = Date.now();
    const expiresSoon = account.tokenExpiresAt != null && account.tokenExpiresAt < now + 60_000;
    if (!expiresSoon || !account.encryptedRefreshToken) return account;
    const rt = await decryptSecret(account.encryptedRefreshToken);
    const refreshed = await refreshAccessTokenForPlatform(account.platform, rt);
    if (!refreshed?.accessToken) return account;
    const { encryptSecret } = await import("./oauth/crypto");
    const encAccess = await encryptSecret(refreshed.accessToken);
    const patch: Record<string, unknown> = { encryptedAccessToken: encAccess, tokenExpiresAt: refreshed.expiresAt, status: "active", updatedAt: now };
    if (refreshed.refreshToken) {
      patch.encryptedRefreshToken = await encryptSecret(refreshed.refreshToken);
      if (refreshed.refreshTokenExpiresAt) patch.refreshTokenExpiresAt = refreshed.refreshTokenExpiresAt;
    }
    await ctx.db.patch("connectedAccounts", account._id, patch);
    const updated = await ctx.db.get("connectedAccounts", account._id);
    return updated as Doc<"connectedAccounts"> | null;
  },
});
export const markTargetPublishing = internalMutation({
  args: { targetId: v.id("postTargets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const t = await ctx.db.get("postTargets", args.targetId);
    if (!t) return null;
    if (t.status === "publishing") return null;
    await ctx.db.patch("postTargets", args.targetId, { status: "publishing", updatedAt: Date.now() });
    return null;
  },
});
export const markTargetPublished = internalMutation({
  args: { targetId: v.id("postTargets"), platformPostId: v.string(), permalink: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("postTargets", args.targetId, {
      status: "published",
      publishedAt: Date.now(),
      platformPostId: args.platformPostId,
      platformPermalink: args.permalink,
      failureCode: undefined,
      failureMessage: undefined,
      attempts: ((await ctx.db.get("postTargets", args.targetId))?.attempts ?? 0) + 1,
      updatedAt: Date.now(),
    });
    return null;
  },
});
export const markTargetFailed = internalMutation({
  args: { targetId: v.id("postTargets"), failureCode: v.string(), failureMessage: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const t = await ctx.db.get("postTargets", args.targetId);
    if (!t) return null;
    await ctx.db.patch("postTargets", args.targetId, { status: "failed", failureCode: args.failureCode, failureMessage: args.failureMessage, attempts: t.attempts + 1, updatedAt: Date.now() });
    return null;
  },
});
export const reconcilePostStatus = internalMutation({
  args: { postId: v.id("posts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const targets = await ctx.db.query("postTargets").withIndex("by_post", (q) => q.eq("postId", args.postId)).collect();
    if (targets.length === 0) return null;
    const hasPublished = targets.some((t) => t.status === "published");
    const hasFailed = targets.some((t) => t.status === "failed");
    const hasPublishing = targets.some((t) => t.status === "publishing" || t.status === "scheduled" || t.status === "draft");
    let status: Doc<"posts">["status"] = "published";
    if (hasPublishing) status = "publishing";
    else if (!hasPublished && hasFailed) status = "failed";
    else status = "published";
    await ctx.db.patch("posts", args.postId, { status, updatedAt: Date.now() });
    return null;
  },
});
