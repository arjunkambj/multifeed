"use node";

import type { Doc } from "../_generated/dataModel";

const TIMEOUT = 30_000;

function effectiveBody(post: Doc<"posts">, target: Doc<"postTargets">): string {
  return (target.bodyOverride?.trim() || post.body?.trim() || "").slice(0, 2200);
}

function toPrivacyLevel(visibility?: string): string {
  if (visibility === "followers" || visibility === "private") return "SELF_ONLY";
  return "PUBLIC_TO_EVERYONE";
}

type TikTokInitResponse = {
  data?: { publish_id?: string; upload_url?: string };
  error?: { code?: string; message?: string };
};

export async function publishToTiktok(params: {
  post: Doc<"posts">;
  target: Doc<"postTargets">;
  account: Doc<"connectedAccounts">;
  media: Doc<"mediaAssets">[];
  accessToken: string;
}): Promise<{ platformPostId: string; permalink?: string }> {
  const { post, target, media, accessToken } = params;
  const title = effectiveBody(post, target);
  const s = target.platformSettings;

  if (media.length === 0) throw new Error("TikTok requires a video");

  const primary = media[0]!;
  const url =
    primary.publicUrl ??
    (primary as unknown as { externalUrl?: string }).externalUrl ??
    null;

  const isVideo = primary.kind === "video" || post.kind === "video";

  if (isVideo) {
    if (primary.kind !== "video") throw new Error("TikTok requires a video");

    const post_info = {
      title,
      privacy_level: toPrivacyLevel(s?.visibility),
      disable_duet: !s?.allowDuet,
      disable_stitch: !s?.allowStitch,
      disable_comment: !s?.allowComments,
      video_cover_timestamp_ms: 1000,
    };

    // Prefer PULL_FROM_URL when a fetchable URL exists
    if (url) {
      const res = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
          post_info,
          source_info: { source: "PULL_FROM_URL", video_url: url },
        }),
        signal: AbortSignal.timeout(TIMEOUT),
      });
      const json = (await res.json().catch(() => ({}))) as TikTokInitResponse;
      if (res.ok && json.data?.publish_id) {
        return { platformPostId: json.data.publish_id };
      }
      // If PULL_FROM_URL is not supported, fall through to FILE_UPLOAD
      const isPullFallback =
        json.error?.message?.toLowerCase().includes("pull") ||
        json.error?.message?.toLowerCase().includes("source") ||
        res.status === 400;
      if (!isPullFallback) {
        throw new Error(json.error?.message ?? `TikTok init failed: ${res.status}`);
      }
    }

    const size = primary.sizeBytes;
    if (!size || !Number.isFinite(size)) throw new Error("TikTok video size missing");
    if (!url) throw new Error("TikTok video URL missing for upload");

    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info,
        source_info: {
          source: "FILE_UPLOAD",
          video_size: size,
          chunk_size: size,
          total_chunk_count: 1,
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const initJson = (await initRes.json().catch(() => ({}))) as TikTokInitResponse;
    if (!initRes.ok || !initJson.data?.publish_id || !initJson.data.upload_url) {
      throw new Error(initJson.error?.message ?? `TikTok FILE_UPLOAD init failed: ${initRes.status}`);
    }

    const dl = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!dl.ok) throw new Error(`Video download failed: ${dl.status}`);
    const bytes = new Uint8Array(await dl.arrayBuffer());

    const putRes = await fetch(initJson.data.upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": primary.mimeType || "video/mp4",
        "Content-Range": `bytes 0-${bytes.byteLength - 1}/${bytes.byteLength}`,
      },
      body: bytes as unknown as never,
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!putRes.ok) {
      const text = await putRes.text().catch(() => "");
      throw new Error(`TikTok video upload failed: ${putRes.status} ${text.slice(0, 500)}`);
    }

    return { platformPostId: initJson.data.publish_id };
  }

  // Image / photo posts via Content Posting API
  if (primary.kind === "image" || post.kind === "image") {
    const imageUrls = media
      .filter((m) => m.kind === "image")
      .map((m) => m.publicUrl ?? (m as unknown as { externalUrl?: string }).externalUrl)
      .filter((u): u is string => Boolean(u));
    if (imageUrls.length === 0) throw new Error("TikTok image URL missing");

    const res = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title,
          privacy_level: toPrivacyLevel(s?.visibility),
          disable_comment: !s?.allowComments,
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_cover_index: 0,
          photo_images: imageUrls,
        },
        post_mode: "MEDIA_UPLOAD",
        media_type: "PHOTO",
      }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const json = (await res.json().catch(() => ({}))) as TikTokInitResponse;
    if (!res.ok || !json.data?.publish_id) {
      if (json.error?.message) throw new Error(json.error.message);
      throw new Error("TikTok image requires Content Posting API photo mode - not yet supported");
    }
    return { platformPostId: json.data.publish_id };
  }

  throw new Error(`TikTok: unsupported kind ${post.kind}`);
}
