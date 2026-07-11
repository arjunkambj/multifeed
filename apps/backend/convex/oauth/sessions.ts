import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { requireUser } from "../hexclave/auth";
import { platform as platformValidator } from "../schema";
import { randomUrlSafe } from "./crypto";
import { requireOAuthServer } from "./server";

const SESSION_TTL_MS = 10 * 60 * 1000;

/** Same rules as web sanitizeReturnTo — keep relative, same-app paths only. */
function sanitizeReturnTo(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return undefined;
  if (trimmed.includes("\\") || trimmed.includes("://")) return undefined;
  if (trimmed.length > 512) return undefined;
  const pathOnly = trimmed.split("?")[0]!.split("#")[0]!;
  const allowed = [
    "/connections",
    "/posts",
    "/calendar",
    "/inbox",
    "/settings",
    "/billing",
    "/team",
    "/overview",
  ];
  if (!allowed.some((p) => pathOnly === p || pathOnly.startsWith(`${p}/`))) {
    return undefined;
  }
  return trimmed;
}

/**
 * Create OAuth session for the current team user.
 * Does not enforce plan limit here — reconnects of existing accounts must be
 * allowed; hard limit is enforced on net-new inserts in accounts.saveMany.
 */
export const create = mutation({
  args: {
    serverSecret: v.string(),
    platform: platformValidator,
    returnTo: v.optional(v.string()),
    usePkce: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    requireOAuthServer(args.serverSecret);
    const user = await requireUser(ctx);

    const now = Date.now();
    const state = randomUrlSafe(24);
    const codeVerifier = args.usePkce ? randomUrlSafe(48) : undefined;

    await ctx.db.insert("oauthSessions", {
      state,
      teamId: user.selectedTeamId,
      userId: user.id,
      platform: args.platform,
      codeVerifier,
      returnTo: sanitizeReturnTo(args.returnTo),
      phase: "authorize",
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    });

    return {
      state,
      codeVerifier,
      platform: args.platform,
    };
  },
});

/**
 * Atomically consume an authorize session for the server-side code exchange.
 * Returns codeVerifier once; concurrent callers fail after the first.
 * Prefer this over a public query that exposes PKCE secrets to the browser.
 */
export const beginExchange = mutation({
  args: { state: v.string(), serverSecret: v.string() },
  handler: async (ctx, args) => {
    requireOAuthServer(args.serverSecret);
    const user = await requireUser(ctx);
    const session = await ctx.db
      .query("oauthSessions")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .unique();

    if (
      !session ||
      session.teamId !== user.selectedTeamId ||
      session.userId !== user.id
    ) {
      return null;
    }

    if (session.expiresAt < Date.now()) {
      await ctx.db.delete(session._id);
      return null;
    }

    if (session.phase !== "authorize") {
      return null;
    }

    const codeVerifier = session.codeVerifier;
    await ctx.db.patch(session._id, {
      phase: "exchanging",
      codeVerifier: undefined,
    });

    return {
      state: session.state,
      platform: session.platform,
      codeVerifier,
      returnTo: session.returnTo,
      phase: "exchanging" as const,
      expiresAt: session.expiresAt,
    };
  },
});

export const remove = mutation({
  args: { state: v.string(), serverSecret: v.string() },
  handler: async (ctx, args) => {
    requireOAuthServer(args.serverSecret);
    const user = await requireUser(ctx);
    const session = await ctx.db
      .query("oauthSessions")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .unique();

    if (!session) return { ok: true as const };
    if (session.teamId !== user.selectedTeamId || session.userId !== user.id) {
      throw new Error("OAuth session not found");
    }

    await ctx.db.delete(session._id);
    return { ok: true as const };
  },
});

/** Cron: drop expired OAuth sessions. */
export const purgeExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("oauthSessions")
      .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
      .take(200);

    for (const session of expired) {
      await ctx.db.delete(session._id);
    }

    return { deleted: expired.length };
  },
});
