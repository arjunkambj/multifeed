"use node";

import type { Doc } from "../_generated/dataModel";
import { decryptSecret } from "../oauth/crypto";

const GRAPH = "https://graph.facebook.com/v24.0";
const TIMEOUT_MS = 15_000;

function effectiveBody(post: Doc<"posts">, target: Doc<"postTargets">): string {
  return (target.bodyOverride?.trim() || post.body?.trim() || "").trim();
}

function mediaUrl(asset: Doc<"mediaAssets">): string {
  const url = asset.publicUrl ?? asset.externalUrl;
  if (!url) throw new Error(`Media URL missing for ${asset.filename}`);
  return url;
}

async function graphFetch(url: string, init: RequestInit): Promise<Record<string, string>> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const error = json.error as { message?: string; code?: number; error_user_msg?: string } | undefined;
    const message = error?.message ?? (json.message as string | undefined) ?? `HTTP ${res.status}`;
    const code = error?.code;
    if (res.status === 429 || code === 4 || code === 80004 || code === 368 || message.toLowerCase().includes("rate")) {
      console.error(`[meta] rate limited ${url}: ${message} code=${code}`, json);
    } else {
      console.error(`[meta] Graph error ${url}: ${message}`, json);
    }
    throw new Error(message);
  }
  return json as Record<string, string>;
}

export async function decryptToken(account: Doc<"connectedAccounts">): Promise<string> {
  if (!account.encryptedAccessToken) throw new Error("Missing access token");
  return decryptSecret(account.encryptedAccessToken);
}

export async function publishToFacebook(params: {
  post: Doc<"posts">;
  target: Doc<"postTargets">;
  account: Doc<"connectedAccounts">;
  media: Doc<"mediaAssets">[];
  accessToken: string;
}): Promise<{ platformPostId: string; permalink?: string }> {
  const { post, target, account, media, accessToken } = params;
  const body = effectiveBody(post, target);
  const pageId =
    account.providerAccountId ??
    (account.metadata as Record<string, unknown> | undefined)?.pageId as string | undefined;
  if (!pageId || typeof pageId !== "string") throw new Error("Facebook Page ID missing");

  if (post.kind === "text" && media.length === 0) {
    const data = await graphFetch(`${GRAPH}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ message: body, access_token: accessToken }),
    });
    const id = data.id ?? data.post_id;
    if (!id) throw new Error("Facebook: no post id returned");
    return { platformPostId: id, permalink: `https://facebook.com/${id}` };
  }

  if (post.kind === "image" || post.kind === "story") {
    if (media.length === 0) throw new Error("Facebook image post requires media");
    if (media.length === 1) {
      const url = mediaUrl(media[0]!);
      const data = await graphFetch(`${GRAPH}/${pageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ url, access_token: accessToken, published: "true", caption: body }),
      });
      const id = data.id ?? data.post_id;
      if (!id) throw new Error("Facebook photo: no id");
      return { platformPostId: id, permalink: `https://facebook.com/${id}` };
    }
    const uploaded: string[] = [];
    for (const m of media) {
      const url = mediaUrl(m);
      const data = await graphFetch(`${GRAPH}/${pageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ url, access_token: accessToken, published: "false" }),
      });
      if (!data.id) throw new Error("Facebook carousel upload failed");
      uploaded.push(data.id);
    }
    const qs = new URLSearchParams({ message: body, access_token: accessToken });
    uploaded.forEach((id, i) => qs.set(`attached_media[${i}]`, JSON.stringify({ media_fbid: id })));
    const data = await graphFetch(`${GRAPH}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: qs,
    });
    const id = data.id ?? data.post_id;
    if (!id) throw new Error("Facebook carousel publish failed");
    return { platformPostId: id, permalink: `https://facebook.com/${id}` };
  }

  if (post.kind === "video") {
    const m = media[0];
    if (!m) throw new Error("Video required");
    const url = mediaUrl(m);
    const data = await graphFetch(`${GRAPH}/${pageId}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ file_url: url, description: body, access_token: accessToken }),
    });
    const id = data.id;
    if (!id) throw new Error("Facebook video: no id");
    return { platformPostId: id, permalink: `https://facebook.com/${id}` };
  }

  throw new Error(`Facebook: unsupported kind ${post.kind}`);
}

export async function publishToInstagram(params: {
  post: Doc<"posts">;
  target: Doc<"postTargets">;
  account: Doc<"connectedAccounts">;
  media: Doc<"mediaAssets">[];
  accessToken: string;
}): Promise<{ platformPostId: string; permalink?: string }> {
  const { post, target, media, accessToken } = params;
  const body = effectiveBody(post, target);
  const igUserId =
    (params.account.metadata as Record<string, unknown> | undefined)?.igUserId ??
    params.account.providerAccountId;
  if (!igUserId || typeof igUserId !== "string") throw new Error("Instagram user ID missing");
  const placement = target.platformSettings?.placement;
  const isReel = placement === "reel" || post.kind === "video";
  const isStory = placement === "story" || post.kind === "story";

  async function createContainer(form: Record<string, string>): Promise<string> {
    const qs = new URLSearchParams({ access_token: accessToken, ...form });
    const data = await graphFetch(`${GRAPH}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: qs,
    });
    if (!data.id) throw new Error("Instagram media creation failed");
    return data.id as string;
  }

  async function publishContainer(creationId: string): Promise<string> {
    const data = await graphFetch(`${GRAPH}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ creation_id: creationId, access_token: accessToken }),
    });
    if (!data.id) throw new Error("Instagram publish failed");
    return data.id as string;
  }

  if (post.kind === "text") throw new Error("Instagram requires an image or video");

  if (post.kind === "image" && media.length === 1) {
    const url = mediaUrl(media[0]!);
    const creationId = await createContainer({
      image_url: url,
      caption: body,
      ...(isStory ? { media_type: "STORIES" } : {}),
      ...(target.platformSettings?.altText ? { alt_text: target.platformSettings.altText } : {}),
    });
    const id = await publishContainer(creationId);
    return { platformPostId: id, permalink: `https://www.instagram.com/p/${id}` };
  }

  if (post.kind === "image" && media.length > 1) {
    const childIds: string[] = [];
    for (const m of media) {
      const url = mediaUrl(m);
      const cid = await createContainer({ image_url: url, is_carousel_item: "true" });
      childIds.push(cid);
    }
    const creationId = await createContainer({
      caption: body,
      media_type: "CAROUSEL",
      children: childIds.join(","),
    });
    const id = await publishContainer(creationId);
    return { platformPostId: id, permalink: `https://www.instagram.com/p/${id}` };
  }

  if (post.kind === "video" || isReel || isStory) {
    const m = media[0];
    if (!m) throw new Error("Video missing");
    const url = mediaUrl(m);
    const creationId = await createContainer({
      video_url: url,
      caption: body,
      media_type: isStory ? "STORIES" : isReel ? "REELS" : "VIDEO",
      ...(isReel && target.platformSettings?.shareToFeed === false ? { share_to_feed: "false" } : {}),
    });
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const id = await publishContainer(creationId);
        return { platformPostId: id, permalink: `https://www.instagram.com/p/${id}` };
      } catch (e) {
        const msg = e instanceof Error ? e.message.toLowerCase() : "";
        if (msg.includes("not ready") || msg.includes("processing") || msg.includes("media is not ready")) {
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        throw e;
      }
    }
    throw new Error("Instagram video not ready for publish");
  }

  throw new Error(`Instagram: unsupported kind ${post.kind}`);
}
