"use node";

import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { decryptSecret } from "../oauth/crypto";

function platformOf(target: Doc<"postTargets">) {
  return target.platform as Doc<"connectedAccounts">["platform"];
}

async function postFirstComment(
  platform: string,
  platformPostId: string,
  firstComment: string,
  accessToken: string,
  account: Doc<"connectedAccounts">,
) {
  if (platform === "x") {
    await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: firstComment, reply: { in_reply_to_tweet_id: platformPostId } }),
      signal: AbortSignal.timeout(15000),
    });
    return;
  }
  if (platform === "facebook") {
    await fetch(`https://graph.facebook.com/v24.0/${platformPostId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ message: firstComment, access_token: accessToken }),
      signal: AbortSignal.timeout(15000),
    });
    return;
  }
  if (platform === "instagram") {
    await fetch(`https://graph.facebook.com/v24.0/${platformPostId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ message: firstComment, access_token: accessToken }),
      signal: AbortSignal.timeout(15000),
    });
    return;
  }
  if (platform === "linkedin") {
    await fetch(`https://api.linkedin.com/v2/socialActions/${encodeURIComponent(platformPostId)}/comments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
      body: JSON.stringify({ actor: `urn:li:person:${account.providerAccountId}`, message: { text: firstComment } }),
      signal: AbortSignal.timeout(15000),
    });
    return;
  }
}

export const publishOneTarget = internalAction({
  args: { postId: v.id("posts"), targetId: v.id("postTargets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = (await ctx.runQuery(internal.publishing.getPostForPublish, { postId: args.postId })) as Doc<"posts"> | null;
    if (!post) return null;
    const target = (await ctx.runQuery(internal.publishing.getTargetForPublish, { targetId: args.targetId })) as Doc<"postTargets"> | null;
    if (!target) return null;
    if (target.status === "published" || target.status === "skipped") return null;
    if (target.postId !== post._id) return null;
    const account = (await ctx.runQuery(internal.publishing.getAccountForPublish, { accountId: target.connectedAccountId })) as Doc<"connectedAccounts"> | null;
    if (!account || account.status !== "active") {
      await ctx.runMutation(internal.publishing.markTargetFailed, { targetId: target._id, failureCode: "account_inactive", failureMessage: account ? `Account @${account.username} is ${account.status}` : "Account not found" });
      return null;
    }
    const freshAccount = ((await ctx.runMutation(internal.publishing.ensureFreshToken, { accountId: account._id })) as Doc<"connectedAccounts"> | null) ?? account;
    const at = freshAccount.encryptedAccessToken ? await decryptSecret(freshAccount.encryptedAccessToken) : null;
    if (!at) {
      await ctx.runMutation(internal.publishing.markTargetFailed, { targetId: target._id, failureCode: "no_token", failureMessage: "No access token for account" });
      return null;
    }
    const media = (await ctx.runQuery(internal.publishing.getMediaForPost, { postId: post._id })) as Doc<"mediaAssets">[];
    await ctx.runMutation(internal.publishing.markTargetPublishing, { targetId: target._id });
    try {
      let result: { platformPostId: string; permalink?: string };
      const platform = platformOf(target);
      if (platform === "facebook") {
        const { publishToFacebook } = await import("./meta");
        result = await publishToFacebook({ post: post as Doc<"posts">, target: target as Doc<"postTargets">, account: freshAccount as Doc<"connectedAccounts">, media: media as Doc<"mediaAssets">[], accessToken: at });
      } else if (platform === "instagram") {
        const { publishToInstagram } = await import("./meta");
        result = await publishToInstagram({ post: post as Doc<"posts">, target: target as Doc<"postTargets">, account: freshAccount as Doc<"connectedAccounts">, media: media as Doc<"mediaAssets">[], accessToken: at });
      } else if (platform === "x") {
        const { publishToX } = await import("./x");
        result = await publishToX({ post: post as Doc<"posts">, target: target as Doc<"postTargets">, account: freshAccount as Doc<"connectedAccounts">, media: media as Doc<"mediaAssets">[], accessToken: at });
      } else if (platform === "linkedin") {
        const { publishToLinkedin } = await import("./linkedin");
        result = await publishToLinkedin({ post: post as Doc<"posts">, target: target as Doc<"postTargets">, account: freshAccount as Doc<"connectedAccounts">, media: media as Doc<"mediaAssets">[], accessToken: at });
      } else if (platform === "threads") {
        const { publishToThreads } = await import("./threads");
        result = await publishToThreads({ post: post as Doc<"posts">, target: target as Doc<"postTargets">, account: freshAccount as Doc<"connectedAccounts">, media: media as Doc<"mediaAssets">[], accessToken: at });
      } else if (platform === "tiktok") {
        const { publishToTiktok } = await import("./tiktok");
        result = await publishToTiktok({ post: post as Doc<"posts">, target: target as Doc<"postTargets">, account: freshAccount as Doc<"connectedAccounts">, media: media as Doc<"mediaAssets">[], accessToken: at });
      } else if (platform === "youtube") {
        const { publishToYoutube } = await import("./youtube");
        result = await publishToYoutube({ post: post as Doc<"posts">, target: target as Doc<"postTargets">, account: freshAccount as Doc<"connectedAccounts">, media: media as Doc<"mediaAssets">[], accessToken: at });
      } else if (platform === "bluesky" || platform === "google_business") {
        throw new Error(`${platform} publishing is not supported yet — select a supported platform for this post`);
      } else {
        throw new Error(`Unsupported platform ${platform}`);
      }
      await ctx.runMutation(internal.publishing.markTargetPublished, { targetId: target._id, platformPostId: result.platformPostId, permalink: result.permalink });
      if (target.firstComment) {
        try {
          await postFirstComment(platformOf(target), result.platformPostId, target.firstComment, at, freshAccount as Doc<"connectedAccounts">);
        } catch (e) {
          console.error(`[publishing] firstComment failed for ${target.platform} ${target._id}:`, e);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[publishing] publish failed ${target.platform} ${target._id}:`, msg);
      await ctx.runMutation(internal.publishing.markTargetFailed, { targetId: target._id, failureCode: "publish_failed", failureMessage: msg.slice(0, 1000) });
    } finally {
      await ctx.runMutation(internal.publishing.reconcilePostStatus, { postId: post._id });
    }
    return null;
  },
});
