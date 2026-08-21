"use node";

import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { decryptSecret } from "../oauth/crypto";
import { LINKEDIN_VERSION, META_GRAPH, THREADS_GRAPH } from "./apiVersions";
import { isResumablePublishError } from "./helpers";
import { refreshAccessTokenForPlatform } from "./tokenRefresh";

function r2Client() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Convex is missing R2_ENDPOINT, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY");
  }
  return new S3Client({
    region: "auto",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
}

async function freshMediaUrl(key: string) {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("Convex is missing R2_BUCKET");
  return getSignedUrl(
    r2Client(),
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 6 * 60 * 60 },
  );
}

function platformOf(target: Doc<"postTargets">) {
  return target.platform;
}

async function postFirstComment(
  platform: Doc<"postTargets">["platform"],
  platformPostId: string,
  firstComment: string,
  accessToken: string,
  account: Doc<"connectedAccounts">,
) {
  if (platform === "youtube" || platform === "tiktok") {
    throw new Error(`First comments are not supported on ${platform}`);
  }
  if (platform === "x") {
    const res = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: firstComment,
        reply: { in_reply_to_tweet_id: platformPostId },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`X first comment failed: ${res.status}`);
    return;
  }

  if (platform === "facebook" || platform === "instagram") {
    const res = await fetch(
      `${META_GRAPH}/${platformPostId}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          message: firstComment,
          access_token: accessToken,
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!res.ok) throw new Error(`${platform} first comment failed: ${res.status}`);
    return;
  }

  if (platform === "linkedin") {
    const meta = account.metadata as Record<string, unknown> | undefined;
    const actor =
      (typeof meta?.authorUrn === "string" && meta.authorUrn.startsWith("urn:li:") && meta.authorUrn) ||
      (typeof meta?.organizationId === "string" && `urn:li:organization:${meta.organizationId}`) ||
      `urn:li:person:${account.providerAccountId}`;
    const res = await fetch(
      `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(platformPostId)}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": LINKEDIN_VERSION,
        },
        body: JSON.stringify({
          actor,
          object: platformPostId,
          message: { text: firstComment },
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!res.ok) throw new Error(`LinkedIn first comment failed: ${res.status}`);
    return;
  }

  if (platform === "threads") {
    const userId = account.providerAccountId;
    const createRes = await fetch(`${THREADS_GRAPH}/${userId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        media_type: "TEXT",
        text: firstComment,
        reply_to_id: platformPostId,
        access_token: accessToken,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const created = (await createRes.json().catch(() => ({}))) as { id?: string };
    if (!createRes.ok || !created.id) {
      throw new Error(`Threads first comment failed: ${createRes.status}`);
    }
    const publishRes = await fetch(
      `${THREADS_GRAPH}/${userId}/threads_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          creation_id: created.id,
          access_token: accessToken,
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!publishRes.ok) {
      throw new Error(`Threads first comment publish failed: ${publishRes.status}`);
    }
  }
}

export const publishOneTarget = internalAction({
  args: { postId: v.id("posts"), targetId: v.id("postTargets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const claim = await ctx.runMutation(internal.publishing.claimTargetForPublish, {
      targetId: args.targetId,
    });
    if (claim === "missing" || claim === "busy") return null;
    if (claim === "done") {
      const post = (await ctx.runQuery(internal.publishing.getPostForPublish, {
        postId: args.postId,
      })) as Doc<"posts"> | null;
      if (post) {
        await ctx.runMutation(internal.publishing.reconcilePostStatus, {
          postId: post._id,
        });
      }
      return null;
    }

    const post = (await ctx.runQuery(internal.publishing.getPostForPublish, {
      postId: args.postId,
    })) as Doc<"posts"> | null;
    const target = (await ctx.runQuery(internal.publishing.getTargetForPublish, {
      targetId: args.targetId,
    })) as Doc<"postTargets"> | null;
    if (!post || !target || target.postId !== post._id) {
      await ctx.runMutation(internal.publishing.markTargetFailed, {
        targetId: args.targetId,
        failureCode: "missing_post",
        failureMessage: "Post or target disappeared before publishing",
      });
      return null;
    }

    const account = (await ctx.runQuery(internal.publishing.getAccountForPublish, {
      accountId: target.connectedAccountId,
    })) as Doc<"connectedAccounts"> | null;
    if (!account || account.status !== "active") {
      await ctx.runMutation(internal.publishing.markTargetFailed, {
        targetId: target._id,
        failureCode: "account_inactive",
        failureMessage: account
          ? `Account @${account.username} is ${account.status}`
          : "Account not found",
      });
      await ctx.runMutation(internal.publishing.reconcilePostStatus, {
        postId: post._id,
      });
      return null;
    }

    let freshAccount = account;
    const now = Date.now();
    const expiresSoon =
      account.tokenExpiresAt == null || account.tokenExpiresAt < now + 60_000;
    if (expiresSoon) {
      if (!account.encryptedRefreshToken) {
        await ctx.runMutation(internal.publishing.markAccountExpired, {
          accountId: account._id,
          errorMessage: "Reconnect this account to refresh its access token",
        });
        await ctx.runMutation(internal.publishing.markTargetFailed, {
          targetId: target._id,
          failureCode: "no_token",
          failureMessage: "Reconnect this account and try again",
        });
        await ctx.runMutation(internal.publishing.reconcilePostStatus, {
          postId: post._id,
        });
        return null;
      }
      try {
        const refreshToken = await decryptSecret(account.encryptedRefreshToken);
        const refreshed = await refreshAccessTokenForPlatform(account, refreshToken);
        if (!refreshed?.accessToken) throw new Error("Could not refresh this account");
        freshAccount = ((await ctx.runMutation(internal.publishing.applyRefreshedToken, {
          accountId: account._id,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          expiresAt: refreshed.expiresAt,
          refreshTokenExpiresAt: refreshed.refreshTokenExpiresAt,
        })) as Doc<"connectedAccounts"> | null) ?? account;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const stillUsable =
          Boolean(account.encryptedAccessToken) &&
          (account.tokenExpiresAt == null || account.tokenExpiresAt > now);
        if (!stillUsable) {
          await ctx.runMutation(internal.publishing.markAccountExpired, {
            accountId: account._id,
            errorMessage: message,
          });
          await ctx.runMutation(internal.publishing.markTargetFailed, {
            targetId: target._id,
            failureCode: "no_token",
            failureMessage: "Reconnect this account and try again",
          });
          await ctx.runMutation(internal.publishing.reconcilePostStatus, {
            postId: post._id,
          });
          return null;
        }
      }
    }
    const accessToken = freshAccount.encryptedAccessToken
      ? await decryptSecret(freshAccount.encryptedAccessToken)
      : null;
    if (!accessToken) {
      await ctx.runMutation(internal.publishing.markTargetFailed, {
        targetId: target._id,
        failureCode: "no_token",
        failureMessage: "Reconnect this account and try again",
      });
      await ctx.runMutation(internal.publishing.reconcilePostStatus, {
        postId: post._id,
      });
      return null;
    }

    const storedMedia = (await ctx.runQuery(internal.publishing.getMediaForPost, {
      postId: post._id,
    })) as Doc<"mediaAssets">[];
    const media = await Promise.all(
      storedMedia.map(async (asset) => {
        if (!asset.r2Key) {
          if (asset.publicUrl || asset.externalUrl) return asset;
          throw new Error(`Media file ${asset.filename} is missing. Re-upload it and try again.`);
        }
        try {
          await r2Client().send(new HeadObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: asset.r2Key,
          }));
        } catch {
          throw new Error(`Media file ${asset.filename} is missing from storage. Re-upload it and try again.`);
        }
        const publicUrl = await freshMediaUrl(asset.r2Key);
        return { ...asset, publicUrl };
      }),
    );
    const existingAttempt =
      claim === "resume" && target.publishAttempt && typeof target.publishAttempt === "object"
        ? (target.publishAttempt as Record<string, unknown>)
        : undefined;
    const saveAttempt = async (attempt: Record<string, unknown>) => {
      try {
        await ctx.runMutation(internal.publishing.savePublishAttempt, {
          targetId: target._id,
          attempt,
        });
      } catch (error) {
        console.error(
          `[publishing] could not persist publish checkpoint for ${target._id}:`,
          error,
        );
      }
    };

    try {
      let result: { platformPostId: string; permalink?: string };
      const platform = platformOf(target);
      if (platform === "facebook") {
        const { publishToFacebook } = await import("./meta");
        result = await publishToFacebook({
          post,
          target,
          account: freshAccount,
          media,
          accessToken,
          existingAttempt,
          saveAttempt,
        });
      } else if (platform === "instagram") {
        const { publishToInstagram } = await import("./meta");
        result = await publishToInstagram({
          post,
          target,
          account: freshAccount,
          media,
          accessToken,
          existingAttempt,
          saveAttempt,
        });
      } else if (platform === "x") {
        const { publishToX } = await import("./x");
        result = await publishToX({
          post,
          target,
          account: freshAccount,
          media,
          accessToken,
          existingAttempt,
          saveAttempt,
        });
      } else if (platform === "linkedin") {
        const { publishToLinkedin } = await import("./linkedin");
        result = await publishToLinkedin({
          post,
          target,
          account: freshAccount,
          media,
          accessToken,
          existingAttempt,
          saveAttempt,
        });
      } else if (platform === "threads") {
        const { publishToThreads } = await import("./threads");
        result = await publishToThreads({
          post,
          target,
          account: freshAccount,
          media,
          accessToken,
          existingAttempt,
          saveAttempt,
        });
      } else if (platform === "tiktok") {
        const { publishToTiktok } = await import("./tiktok");
        result = await publishToTiktok({
          post,
          target,
          account: freshAccount,
          media,
          accessToken,
          existingAttempt,
          saveAttempt,
        });
      } else if (platform === "youtube") {
        const { publishToYoutube } = await import("./youtube");
        result = await publishToYoutube({
          post,
          target,
          account: freshAccount,
          media,
          accessToken,
          existingAttempt,
          saveAttempt,
        });
      } else {
        throw new Error(`${platform} publishing is not supported`);
      }

      await ctx.runMutation(internal.publishing.markTargetPublished, {
        targetId: target._id,
        platformPostId: result.platformPostId,
        permalink: result.permalink,
      });
      if (target.firstComment) {
        try {
          await postFirstComment(
            platform,
            result.platformPostId,
            target.firstComment,
            accessToken,
            freshAccount,
          );
        } catch (error) {
          const firstCommentError =
            error instanceof Error ? error.message : String(error);
          console.error(
            `[publishing] firstComment failed for ${target.platform} ${target._id}:`,
            firstCommentError,
          );
          await ctx.runMutation(internal.publishing.noteFirstCommentError, {
            targetId: target._id,
            firstCommentError: firstCommentError.slice(0, 1000),
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isResumablePublishError(error)) {
        console.error(
          `[publishing] publish still in progress ${target.platform} ${target._id}:`,
          message,
        );
      } else {
        console.error(
          `[publishing] publish failed ${target.platform} ${target._id}:`,
          message,
        );
        await ctx.runMutation(internal.publishing.markTargetFailed, {
          targetId: target._id,
          failureCode: "publish_failed",
          failureMessage: message.slice(0, 1000),
        });
      }
    } finally {
      await ctx.runMutation(internal.publishing.reconcilePostStatus, {
        postId: post._id,
      });
    }
    return null;
  },
});

export const resolveMediaUrl = internalAction({
  args: { mediaAssetId: v.id("mediaAssets") },
  returns: v.object({
    ok: v.boolean(),
    status: v.optional(v.number()),
    contentType: v.optional(v.string()),
    bytes: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const asset = await ctx.runQuery(internal.publishing.getMediaAssetForPublish, {
      mediaAssetId: args.mediaAssetId,
    });
    if (!asset?.r2Key) {
      return { ok: false, error: "Media asset or r2Key missing" };
    }
    const url = await freshMediaUrl(asset.r2Key);
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      return { ok: false, status: res.status, error: res.statusText };
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return {
      ok: buf.byteLength > 0,
      status: res.status,
      contentType: res.headers.get("content-type") ?? undefined,
      bytes: buf.byteLength,
    };
  },
});

export const smokeTestMediaSigning = internalAction({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    status: v.optional(v.number()),
    bytes: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async () => {
    const bucket = process.env.R2_BUCKET;
    if (!bucket) return { ok: false, error: "missing R2_BUCKET" };
    const key = `publish-smoke/${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
    const body = new TextEncoder().encode("multifeed-publish-smoke");
    const client = r2Client();
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "text/plain",
    }));
    try {
      const url = await freshMediaUrl(key);
      const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(30_000) });
      if (!res.ok) {
        return { ok: false, status: res.status, error: res.statusText };
      }
      const buf = new Uint8Array(await res.arrayBuffer());
      return { ok: new TextDecoder().decode(buf) === "multifeed-publish-smoke", status: res.status, bytes: buf.byteLength };
    } finally {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => undefined);
    }
  },
});

export const checkPublishReadiness = internalAction({
  args: {},
  returns: v.array(
    v.object({
      platform: v.string(),
      username: v.string(),
      status: v.string(),
      ready: v.boolean(),
      issues: v.array(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const accounts = await ctx.runQuery(internal.publishing.listAccountsForReadiness, {});
    const results: Array<{
      platform: string;
      username: string;
      status: string;
      ready: boolean;
      issues: string[];
    }> = [];
    for (const account of accounts) {
      const issues: string[] = [];
      if (account.status !== "active") issues.push(`account is ${account.status}`);
      const missing = (await import("./helpers")).missingPublishScopes(account.platform, account.scopes);
      if (missing.length) issues.push(`missing scopes: ${missing.join(", ")}`);
      const full = (await ctx.runQuery(internal.publishing.getAccountForPublish, {
        accountId: account._id,
      })) as Doc<"connectedAccounts"> | null;
      if (!full) {
        issues.push("account disappeared");
      } else {
        const expiresSoon =
          full.tokenExpiresAt == null || full.tokenExpiresAt < Date.now() + 60_000;
        if (expiresSoon) {
          if (!full.encryptedRefreshToken) {
            issues.push("token refresh failed");
          } else {
            try {
              const refreshToken = await decryptSecret(full.encryptedRefreshToken);
              const refreshed = await refreshAccessTokenForPlatform(full, refreshToken);
              if (!refreshed?.accessToken) issues.push("token refresh failed");
            } catch (error) {
              issues.push(error instanceof Error ? error.message : "token refresh failed");
            }
          }
        }
      }
      results.push({
        platform: account.platform,
        username: account.username,
        status: account.status,
        ready: issues.length === 0,
        issues,
      });
    }
    return results;
  },
});
