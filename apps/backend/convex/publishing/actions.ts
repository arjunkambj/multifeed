"use node";

import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { decryptSecret } from "../oauth/crypto";
import { LINKEDIN_VERSION, META_GRAPH, THREADS_GRAPH } from "./apiVersions";
import {
  isResumablePublishError,
  linkedinAuthorUrn,
  type PublishInput,
  type PublishedPost,
} from "./helpers";
import { publishToFacebook, publishToInstagram } from "./meta";
import { publishToLinkedIn } from "./linkedin";
import { publishToThreads } from "./threads";
import { publishToTiktok } from "./tiktok";
import { publishToX } from "./x";
import { publishToYoutube } from "./youtube";

const publishers: Record<
  Doc<"postTargets">["platform"],
  (input: PublishInput) => Promise<PublishedPost>
> = {
  facebook: publishToFacebook,
  instagram: publishToInstagram,
  linkedin: publishToLinkedIn,
  threads: publishToThreads,
  tiktok: publishToTiktok,
  x: publishToX,
  youtube: publishToYoutube,
};
import { refreshAccessTokenForPlatform } from "./tokenRefresh";

function r2Client() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Convex is missing R2_ENDPOINT, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY",
    );
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
    const res = await fetch(`${META_GRAPH}/${platformPostId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        message: firstComment,
        access_token: accessToken,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok)
      throw new Error(`${platform} first comment failed: ${res.status}`);
    return;
  }

  if (platform === "linkedin") {
    const actor = linkedinAuthorUrn(
      account.providerAccountId,
      account.metadata,
    );
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
    if (!res.ok)
      throw new Error(`LinkedIn first comment failed: ${res.status}`);
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
    const created = (await createRes.json().catch(() => ({}))) as {
      id?: string;
    };
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
      throw new Error(
        `Threads first comment publish failed: ${publishRes.status}`,
      );
    }
  }
}

export const publishOneTarget = internalAction({
  args: { postId: v.id("posts"), targetId: v.id("postTargets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const claim = await ctx.runMutation(
      internal.publishing.claimTargetForPublish,
      {
        targetId: args.targetId,
      },
    );
    if (claim === "missing" || claim === "busy") return null;
    if (claim === "done") {
      const post = await ctx.runQuery(internal.publishing.getPostForPublish, {
        postId: args.postId,
      });
      if (post) {
        await ctx.runMutation(internal.publishing.reconcilePostStatus, {
          postId: post._id,
        });
      }
      return null;
    }

    const post = await ctx.runQuery(internal.publishing.getPostForPublish, {
      postId: args.postId,
    });
    const target = await ctx.runQuery(internal.publishing.getTargetForPublish, {
      targetId: args.targetId,
    });
    if (!post || !target || target.postId !== post._id) {
      await ctx.runMutation(internal.publishing.markTargetFailed, {
        targetId: args.targetId,
        failureCode: "missing_post",
        failureMessage: "Post or target disappeared before publishing",
      });
      return null;
    }

    const account = await ctx.runQuery(
      internal.publishing.getAccountForPublish,
      {
        accountId: target.connectedAccountId,
      },
    );
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
        const refreshed = await refreshAccessTokenForPlatform(
          account,
          refreshToken,
        );
        if (!refreshed?.accessToken)
          throw new Error("Could not refresh this account");
        freshAccount =
          (await ctx.runMutation(internal.publishing.applyRefreshedToken, {
            accountId: account._id,
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            expiresAt: refreshed.expiresAt,
            refreshTokenExpiresAt: refreshed.refreshTokenExpiresAt,
          })) ?? account;
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

    const existingAttempt =
      claim === "resume" ? target.publishAttempt : undefined;
    const saveAttempt: PublishInput["saveAttempt"] = async (attempt) => {
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
      const storedMedia = await ctx.runQuery(
        internal.publishing.getMediaForPost,
        {
          postId: post._id,
        },
      );
      const media = await Promise.all(
        storedMedia.map(async (asset) => {
          if (!asset.r2Key) {
            if (asset.publicUrl || asset.externalUrl) return asset;
            throw new Error(
              `Media file ${asset.filename} is missing. Re-upload it and try again.`,
            );
          }
          try {
            await r2Client().send(
              new HeadObjectCommand({
                Bucket: process.env.R2_BUCKET,
                Key: asset.r2Key,
              }),
            );
          } catch {
            throw new Error(
              `Media file ${asset.filename} is missing from storage. Re-upload it and try again.`,
            );
          }
          const publicUrl = await freshMediaUrl(asset.r2Key);
          return { ...asset, publicUrl };
        }),
      );
      const platform = target.platform;
      const result = await publishers[platform]({
        post,
        target,
        account: freshAccount,
        media,
        accessToken,
        existingAttempt,
        saveAttempt,
      });

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
