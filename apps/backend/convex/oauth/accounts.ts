import { type Infer, v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { entitlementsForTeam } from "../billing";
import { requireUser } from "../hexclave/auth";
import {
  capability,
  platform as platformValidator,
  tokenType,
} from "../schema";
import { encryptSecret } from "./crypto";
import { assertCanConnect } from "./limits";
import { requireOAuthServer } from "./server";

const MAX_ACCOUNTS_PER_CONNECTION = 100;
const CLEANUP_BATCH_SIZE = 200;
const DISCONNECTABLE_TARGET_STATUSES = [
  "draft",
  "scheduled",
  "publishing",
  "failed",
] as const;

const accountInput = v.object({
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
});

type AccountInput = Infer<typeof accountInput>;

type PublicAccount = Omit<
  Doc<"connectedAccounts">,
  "encryptedAccessToken" | "encryptedRefreshToken"
>;

/** Drop token fields before returning accounts to the client. */
function stripSecrets(doc: Doc<"connectedAccounts">): PublicAccount {
  const safe = { ...doc };
  delete safe.encryptedAccessToken;
  delete safe.encryptedRefreshToken;
  return safe;
}

export async function listAccountsForTeam(
  ctx: QueryCtx,
  teamId: string,
  selectedPlatform?: Doc<"connectedAccounts">["platform"],
) {
  const rows = selectedPlatform
    ? await ctx.db
        .query("connectedAccounts")
        .withIndex("by_team_provider", (q) =>
          q.eq("teamId", teamId).eq("platform", selectedPlatform),
        )
        .collect()
    : await ctx.db
        .query("connectedAccounts")
        .withIndex("by_team_provider", (q) => q.eq("teamId", teamId))
        .collect();

  return rows.map(stripSecrets);
}

async function upsertAccount(
  ctx: MutationCtx,
  existing: Doc<"connectedAccounts"> | null,
  input: AccountInput & {
    teamId: string;
    userId: string;
    encryptedAccessToken: string;
    /** Only set when a new refresh token was provided — omit to preserve. */
    encryptedRefreshToken?: string;
    hasNewRefreshToken: boolean;
  },
) {
  const now = Date.now();
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
    // Convex removes fields set to `undefined` — never pass undefined refresh.
    await ctx.db.patch(existing._id, {
      ...baseFields,
      errorMessage: undefined,
      ...(input.hasNewRefreshToken
        ? {
            encryptedRefreshToken: input.encryptedRefreshToken,
            refreshTokenExpiresAt: input.refreshTokenExpiresAt,
          }
        : input.refreshTokenExpiresAt != null
          ? { refreshTokenExpiresAt: input.refreshTokenExpiresAt }
          : {}),
    });
    return existing._id;
  }

  return ctx.db.insert("connectedAccounts", {
    teamId: input.teamId,
    platform: input.platform,
    providerAccountId: input.providerAccountId,
    ...baseFields,
    encryptedRefreshToken: input.encryptedRefreshToken,
    refreshTokenExpiresAt: input.refreshTokenExpiresAt,
    createdAt: now,
  });
}

/** Team-scoped connected accounts (never includes tokens). */
export const list = query({
  args: {
    platform: v.optional(platformValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await listAccountsForTeam(ctx, user.selectedTeamId, args.platform);
  },
});

/** One consistent subscription for everything rendered on Connections. */
export const getConnectionsPageData = query({
  args: { nowMs: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const [accounts, entitlements] = await Promise.all([
      listAccountsForTeam(ctx, user.selectedTeamId),
      entitlementsForTeam(ctx, user.selectedTeamId, args.nowMs),
    ]);
    return { accounts, entitlements };
  },
});

/**
 * Atomically save or update a bounded set of connected accounts.
 * Called from Next.js via fetchMutation only — never pass tokens to the browser.
 */
export const saveMany = mutation({
  args: {
    serverSecret: v.string(),
    accounts: v.array(accountInput),
  },
  handler: async (ctx, args) => {
    requireOAuthServer(args.serverSecret);
    const user = await requireUser(ctx);

    if (
      args.accounts.length === 0 ||
      args.accounts.length > MAX_ACCOUNTS_PER_CONNECTION
    ) {
      throw new Error(
        `A connection must contain between 1 and ${MAX_ACCOUNTS_PER_CONNECTION} accounts`,
      );
    }

    const identities = args.accounts.map(
      ({ platform, providerAccountId }) => `${platform}:${providerAccountId}`,
    );
    if (new Set(identities).size !== identities.length) {
      throw new Error("A connection cannot contain duplicate accounts");
    }

    const accountStates = await Promise.all(
      args.accounts.map(async (account) => ({
        account,
        existing: await ctx.db
          .query("connectedAccounts")
          .withIndex("by_team_provider", (q) =>
            q
              .eq("teamId", user.selectedTeamId)
              .eq("platform", account.platform)
              .eq("providerAccountId", account.providerAccountId),
          )
          .unique(),
      })),
    );

    const additionalAccountCount = accountStates.filter(
      ({ existing }) => existing === null || existing.status === "revoked",
    ).length;
    if (additionalAccountCount > 0) {
      await assertCanConnect(ctx, user.selectedTeamId, additionalAccountCount);
    }

    const encryptedAccounts = await Promise.all(
      accountStates.map(async ({ account, existing }) => {
        const encryptedAccessToken = await encryptSecret(account.accessToken);
        const encryptedRefreshToken = account.refreshToken
          ? await encryptSecret(account.refreshToken)
          : undefined;

        return {
          account,
          existing,
          encryptedAccessToken,
          encryptedRefreshToken,
          hasNewRefreshToken: encryptedRefreshToken !== undefined,
        };
      }),
    );

    const accountIds = await Promise.all(
      encryptedAccounts.map((encrypted) =>
        upsertAccount(ctx, encrypted.existing, {
          ...encrypted.account,
          teamId: user.selectedTeamId,
          userId: user.id,
          encryptedAccessToken: encrypted.encryptedAccessToken,
          encryptedRefreshToken: encrypted.encryptedRefreshToken,
          hasNewRefreshToken: encrypted.hasNewRefreshToken,
        }),
      ),
    );

    return { accountIds };
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

    await ctx.db.patch(args.accountId, {
      status: "revoked",
      encryptedAccessToken: undefined,
      encryptedRefreshToken: undefined,
      tokenExpiresAt: undefined,
      refreshTokenExpiresAt: undefined,
      errorMessage: undefined,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(
      0,
      internal.oauth.accounts.cleanupDisconnectedAccount,
      { accountId: args.accountId },
    );
    return { ok: true as const };
  },
});

/** Bounded follow-up so disconnect latency does not scale with account history. */
export const cleanupDisconnectedAccount = internalMutation({
  args: { accountId: v.id("connectedAccounts") },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account || account.status !== "revoked") {
      return { deletedInboxItems: 0, skippedTargets: 0 };
    }

    const [targetBatches, inbox] = await Promise.all([
      Promise.all(
        DISCONNECTABLE_TARGET_STATUSES.map((status) =>
          ctx.db
            .query("postTargets")
            .withIndex("by_account_schedule", (q) =>
              q.eq("connectedAccountId", args.accountId).eq("status", status),
            )
            .take(CLEANUP_BATCH_SIZE),
        ),
      ),
      ctx.db
        .query("inboxItems")
        .withIndex("by_account_external", (q) =>
          q.eq("connectedAccountId", args.accountId),
        )
        .take(CLEANUP_BATCH_SIZE),
    ]);
    const now = Date.now();

    await Promise.all([
      ...targetBatches.flat().map((target) =>
        ctx.db.patch(target._id, {
          status: "skipped",
          failureCode: "account_disconnected",
          failureMessage: "Connected account was disconnected",
          updatedAt: now,
        }),
      ),
      ...inbox.map((item) => ctx.db.delete(item._id)),
    ]);

    const hasMore =
      inbox.length === CLEANUP_BATCH_SIZE ||
      targetBatches.some((batch) => batch.length === CLEANUP_BATCH_SIZE);
    if (hasMore) {
      await ctx.scheduler.runAfter(
        0,
        internal.oauth.accounts.cleanupDisconnectedAccount,
        args,
      );
    } else {
      await ctx.db.delete(args.accountId);
    }

    return {
      deletedInboxItems: inbox.length,
      skippedTargets: targetBatches.reduce(
        (count, batch) => count + batch.length,
        0,
      ),
    };
  },
});
