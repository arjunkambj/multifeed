import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, query, type MutationCtx } from "../_generated/server";
import { requireUser } from "../hexclave/auth";
import { platform as platformValidator } from "../schema";
import { encryptSecret } from "./crypto";
import { assertCanConnect } from "./limits";
import { requireOAuthServer } from "./server";

const capability = v.union(
  v.literal("text"),
  v.literal("image"),
  v.literal("video"),
  v.literal("carousel"),
  v.literal("analytics"),
  v.literal("inbox"),
);

const tokenType = v.union(
  v.literal("user"),
  v.literal("page"),
  v.literal("organization"),
);

const OAUTH_PLATFORMS = [
  "x",
  "instagram",
  "facebook",
  "threads",
  "linkedin",
  "youtube",
  "pinterest",
  "reddit",
  "tiktok",
  "snapchat",
] as const;

function stripSecrets<T extends Record<string, unknown>>(doc: T) {
  const copy = { ...doc } as T & {
    encryptedAccessToken?: string;
    encryptedRefreshToken?: string;
  };
  delete copy.encryptedAccessToken;
  delete copy.encryptedRefreshToken;
  return copy;
}

async function upsertAccount(
  ctx: MutationCtx,
  input: {
    teamId: string;
    userId: string;
    platform: (typeof OAUTH_PLATFORMS)[number] | string;
    providerAccountId: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    tokenType?: "user" | "page" | "organization";
    capabilities: Array<
      "text" | "image" | "video" | "carousel" | "analytics" | "inbox"
    >;
    scopes: string[];
    encryptedAccessToken: string;
    /** Only set when a new refresh token was provided — omit to preserve. */
    encryptedRefreshToken?: string;
    hasNewRefreshToken: boolean;
    tokenExpiresAt?: number;
    refreshTokenExpiresAt?: number;
    metadata?: unknown;
  },
): Promise<Id<"connectedAccounts">> {
  const now = Date.now();
  const existing = await ctx.db
    .query("connectedAccounts")
    .withIndex("by_team_provider", (q) =>
      q
        .eq("teamId", input.teamId)
        .eq("platform", input.platform as never)
        .eq("providerAccountId", input.providerAccountId),
    )
    .unique();

  const baseFields = {
    username: input.username,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    status: "active" as const,
    tokenType: input.tokenType,
    capabilities: input.capabilities,
    scopes: input.scopes,
    encryptedAccessToken: input.encryptedAccessToken,
    tokenExpiresAt: input.tokenExpiresAt,
    lastSyncedAt: now,
    metadata: input.metadata,
    connectedByUserId: input.userId,
    updatedAt: now,
  };

  if (existing) {
    // Build patch so optional secrets are preserved when omitted.
    // Convex removes fields set to `undefined` — never pass undefined refresh.
    const patch: Record<string, unknown> = {
      ...baseFields,
      errorMessage: undefined, // clear prior errors on successful reconnect
    };
    if (input.hasNewRefreshToken) {
      patch.encryptedRefreshToken = input.encryptedRefreshToken;
      patch.refreshTokenExpiresAt = input.refreshTokenExpiresAt;
    } else if (input.refreshTokenExpiresAt != null) {
      patch.refreshTokenExpiresAt = input.refreshTokenExpiresAt;
    }
    await ctx.db.patch(existing._id, patch);
    return existing._id;
  }

  return await ctx.db.insert("connectedAccounts", {
    teamId: input.teamId,
    platform: input.platform as never,
    providerAccountId: input.providerAccountId,
    ...baseFields,
    encryptedRefreshToken: input.encryptedRefreshToken,
    refreshTokenExpiresAt: input.refreshTokenExpiresAt,
    createdAt: now,
  });
}

export const listPlatforms = query({
  args: {},
  handler: async () => {
    return OAUTH_PLATFORMS.map((platform) => ({ platform }));
  },
});

/** Team-scoped connected accounts (never includes tokens). */
export const list = query({
  args: {
    platform: v.optional(platformValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const teamId = user.selectedTeamId;

    if (args.platform) {
      const rows = await ctx.db
        .query("connectedAccounts")
        .withIndex("by_team_platform", (q) =>
          q.eq("teamId", teamId).eq("platform", args.platform!),
        )
        .collect();
      return rows.map(stripSecrets);
    }

    const rows = await ctx.db
      .query("connectedAccounts")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();
    return rows.map(stripSecrets);
  },
});

/**
 * Save or update a connected account. Encrypts tokens at rest.
 * Called from Next.js via fetchMutation only — never pass tokens to the browser.
 */
export const save = mutation({
  args: {
    serverSecret: v.string(),
    platform: platformValidator,
    providerAccountId: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    tokenType: v.optional(tokenType),
    capabilities: v.array(capability),
    scopes: v.array(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ accountId: Id<"connectedAccounts"> }> => {
    requireOAuthServer(args.serverSecret);
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("connectedAccounts")
      .withIndex("by_team_provider", (q) =>
        q
          .eq("teamId", user.selectedTeamId)
          .eq("platform", args.platform)
          .eq("providerAccountId", args.providerAccountId),
      )
      .unique();

    if (!existing) {
      await assertCanConnect(ctx, user.selectedTeamId);
    }

    const encryptedAccessToken = await encryptSecret(args.accessToken);
    const hasNewRefreshToken =
      args.refreshToken != null && args.refreshToken.length > 0;
    const encryptedRefreshToken = hasNewRefreshToken
      ? await encryptSecret(args.refreshToken!)
      : undefined;

    const accountId = await upsertAccount(ctx, {
      teamId: user.selectedTeamId,
      userId: user.id,
      platform: args.platform,
      providerAccountId: args.providerAccountId,
      username: args.username,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      tokenType: args.tokenType,
      capabilities: args.capabilities,
      scopes: args.scopes,
      encryptedAccessToken,
      encryptedRefreshToken,
      hasNewRefreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
      refreshTokenExpiresAt: args.refreshTokenExpiresAt,
      metadata: args.metadata,
    });

    return { accountId };
  },
});

export const disconnect = mutation({
  args: {
    accountId: v.id("connectedAccounts"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const account = await ctx.db.get(args.accountId);
    if (!account || account.teamId !== user.selectedTeamId) {
      throw new Error("Account not found");
    }

    const now = Date.now();

    // Clean up unpublished targets so the calendar/publisher do not hang.
    const targets = await ctx.db
      .query("postTargets")
      .withIndex("by_account_schedule", (q) =>
        q.eq("connectedAccountId", args.accountId),
      )
      .collect();

    for (const target of targets) {
      if (target.status === "published") {
        // Keep published rows for metrics history; account row is removed.
        continue;
      }
      await ctx.db.patch(target._id, {
        status: "skipped",
        failureCode: "account_disconnected",
        failureMessage: "Connected account was disconnected",
        updatedAt: now,
      });
    }

    // Remove inbox items for this account.
    const inbox = await ctx.db
      .query("inboxItems")
      .withIndex("by_account_external", (q) =>
        q.eq("connectedAccountId", args.accountId),
      )
      .collect();
    for (const item of inbox) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.accountId);
    return { ok: true as const };
  },
});

/** Options only for Meta (etc.) account picker — no tokens. */
export const getPendingSelection = query({
  args: {
    state: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await ctx.db
      .query("oauthSessions")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .unique();

    if (
      !session ||
      session.teamId !== user.selectedTeamId ||
      session.userId !== user.id ||
      session.phase !== "select_account" ||
      session.expiresAt < Date.now()
    ) {
      return null;
    }

    return {
      state: session.state,
      platform: session.platform,
      options: session.pendingOptions as Array<{
        id: string;
        label: string;
        username?: string;
        avatarUrl?: string;
      }> | null,
    };
  },
});
