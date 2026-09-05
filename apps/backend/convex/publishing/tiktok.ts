"use node";

import type { PublishInput, PublishedPost } from "./helpers";
import {
  effectiveCaption,
  interpretTikTokStatus,
  ResumablePublishError,
  tiktokChunkPlan,
  tiktokInteractionDisabled,
  tiktokPrivacyLevel,
} from "./helpers";

const TIMEOUT = 8 * 60 * 1000;
type TikTokInitResponse = {
  data?: { publish_id?: string; upload_url?: string };
  error?: { code?: string; message?: string };
};

type TikTokStatusResponse = {
  data?: {
    status?: string;
    publicaly_available_post_id?: Array<string | number>;
    fail_reason?: string;
  };
  error?: { code?: string; message?: string };
};

async function waitForTikTokPublish(
  accessToken: string,
  publishId: string,
  username?: string,
): Promise<{ platformPostId: string; permalink?: string }> {
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const res = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({ publish_id: publishId }),
        signal: AbortSignal.timeout(TIMEOUT),
      },
    );
    const json = (await res.json().catch(() => ({}))) as TikTokStatusResponse;
    const status = interpretTikTokStatus(json.data?.status);
    if (status === "complete") {
      const publicId = json.data?.publicaly_available_post_id?.[0];
      const handle = username?.replace(/^@/, "");
      return {
        platformPostId: publicId != null ? String(publicId) : publishId,
        permalink: handle
          ? publicId != null
            ? `https://www.tiktok.com/@${handle}/video/${publicId}`
            : `https://www.tiktok.com/@${handle}`
          : undefined,
      };
    }
    if (status === "inbox") {
      throw new Error(
        "TikTok sent this to the inbox instead of publishing. Reconnect with Content Posting API access.",
      );
    }
    if (status === "failed") {
      throw new Error(
        json.data?.fail_reason ??
          json.error?.message ??
          "TikTok publish failed",
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  throw new ResumablePublishError("TikTok is still processing this post");
}

async function uploadVideoFromUrl(
  uploadUrl: string,
  sourceUrl: string,
  videoSize: number,
  mimeType: string,
) {
  const { chunkSize, totalChunkCount } = tiktokChunkPlan(videoSize);
  for (let index = 0; index < totalChunkCount; index += 1) {
    const start = index * chunkSize;
    const end =
      index === totalChunkCount - 1 ? videoSize - 1 : start + chunkSize - 1;
    const source = await fetch(sourceUrl, {
      headers: {
        Range: `bytes=${start}-${end}`,
        "accept-encoding": "identity",
      },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (source.status !== 206) {
      throw new Error(
        source.status === 200
          ? "Media storage did not return the requested video range"
          : `Video download failed: ${source.status}`,
      );
    }
    if (!source.body) throw new Error("Video download returned an empty body");
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType || "video/mp4",
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      },
      body: source.body,
      duplex: "half",
      signal: AbortSignal.timeout(TIMEOUT),
    } as RequestInit);
    if (!putRes.ok && putRes.status !== 206) {
      const text = await putRes.text().catch(() => "");
      throw new Error(
        `TikTok video upload failed: ${putRes.status} ${text.slice(0, 500)}`,
      );
    }
  }
}

export async function publishToTiktok(
  params: PublishInput,
): Promise<PublishedPost> {
  const { post, target, media, accessToken, existingAttempt, saveAttempt } =
    params;
  if (existingAttempt?.kind === "tiktok") {
    return waitForTikTokPublish(
      accessToken,
      existingAttempt.publishId,
      params.account.username,
    );
  }
  const title = effectiveCaption(post.body, target.bodyOverride).slice(0, 2200);
  const settings = target.platformSettings;

  if (media.length === 0) throw new Error("TikTok requires media");

  const primary = media[0]!;
  const isVideo = primary.kind === "video" || post.kind === "video";

  if (isVideo) {
    if (primary.kind !== "video") throw new Error("TikTok requires a video");
    const url = primary.publicUrl ?? primary.externalUrl;
    if (!url) throw new Error("TikTok video URL missing");
    const size = primary.sizeBytes;
    if (!size || !Number.isFinite(size))
      throw new Error("TikTok video size missing");

    const { chunkSize, totalChunkCount } = tiktokChunkPlan(size);
    const initRes = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
          post_info: {
            title,
            privacy_level: tiktokPrivacyLevel(settings?.visibility),
            disable_duet: tiktokInteractionDisabled(settings?.allowDuet),
            disable_stitch: tiktokInteractionDisabled(settings?.allowStitch),
            disable_comment: tiktokInteractionDisabled(settings?.allowComments),
            video_cover_timestamp_ms: 1000,
          },
          source_info: {
            source: "FILE_UPLOAD",
            video_size: size,
            chunk_size: chunkSize,
            total_chunk_count: totalChunkCount,
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT),
      },
    );
    const initJson = (await initRes
      .json()
      .catch(() => ({}))) as TikTokInitResponse;
    if (
      !initRes.ok ||
      !initJson.data?.publish_id ||
      !initJson.data.upload_url
    ) {
      throw new Error(
        initJson.error?.message ??
          `TikTok video init failed: ${initRes.status}`,
      );
    }

    await saveAttempt?.({
      kind: "tiktok",
      publishId: initJson.data.publish_id,
    });
    await uploadVideoFromUrl(
      initJson.data.upload_url,
      url,
      size,
      primary.mimeType,
    );
    return waitForTikTokPublish(
      accessToken,
      initJson.data.publish_id,
      params.account.username,
    );
  }

  if (primary.kind === "image" || post.kind === "image") {
    const imageUrls = media
      .filter((asset) => asset.kind === "image")
      .map((asset) => asset.publicUrl ?? asset.externalUrl)
      .filter((url): url is string => Boolean(url));
    if (imageUrls.length === 0) throw new Error("TikTok image URL missing");

    const res = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/content/init/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
          post_info: {
            title,
            description: title,
            privacy_level: tiktokPrivacyLevel(settings?.visibility),
            disable_comment: tiktokInteractionDisabled(settings?.allowComments),
          },
          source_info: {
            source: "PULL_FROM_URL",
            photo_cover_index: 0,
            photo_images: imageUrls,
          },
          post_mode: "DIRECT_POST",
          media_type: "PHOTO",
        }),
        signal: AbortSignal.timeout(TIMEOUT),
      },
    );
    const json = (await res.json().catch(() => ({}))) as TikTokInitResponse;
    if (!res.ok || !json.data?.publish_id) {
      throw new Error(
        json.error?.message ?? `TikTok photo init failed: ${res.status}`,
      );
    }
    await saveAttempt?.({ kind: "tiktok", publishId: json.data.publish_id });
    return waitForTikTokPublish(
      accessToken,
      json.data.publish_id,
      params.account.username,
    );
  }

  throw new Error(`TikTok: unsupported kind ${post.kind}`);
}
