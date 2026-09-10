"use node";

import type { PublishInput, PublishedPost } from "./helpers";
import type { Doc } from "../_generated/dataModel";
import {
  effectiveCaption,
  publishedFromAttempt,
  ResumablePublishError,
  tweetIdFromUrl,
} from "./helpers";

const TIMEOUT_MS = 8 * 60 * 1000;

async function downloadBytes(
  url: string,
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok)
    throw new Error(`Media download failed: ${res.status} ${res.statusText}`);
  const mimeType =
    res.headers.get("content-type") ?? "application/octet-stream";
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length === 0) throw new Error("Media download returned empty body");
  return { bytes, mimeType };
}

async function parseJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function extractXError(payload: unknown, fallback: string): string {
  if (typeof payload !== "object" || payload === null) return fallback;
  const p = payload as Record<string, unknown>;
  if (typeof p.detail === "string") return p.detail;
  if (typeof p.error === "string") return p.error;
  if (Array.isArray(p.errors)) {
    const first = p.errors[0] as Record<string, unknown> | undefined;
    if (first && typeof first.message === "string") return first.message;
    if (first && typeof first.detail === "string") return first.detail;
  }
  if (typeof p.message === "string") return p.message;
  if (typeof p.title === "string") return p.title;
  return fallback;
}

function mediaIdFrom(
  payload: Record<string, unknown>,
  fallback: string,
): string {
  const nested = payload.data as Record<string, unknown> | undefined;
  const id =
    (typeof payload.id === "string" && payload.id) ||
    (typeof payload.media_id_string === "string" && payload.media_id_string) ||
    (typeof nested?.id === "string" && nested.id) ||
    (typeof nested?.media_id_string === "string" && nested.media_id_string);
  if (!id) throw new Error(extractXError(payload, fallback));
  return id;
}

async function uploadImageToX(
  bytes: Uint8Array,
  accessToken: string,
  mimeType: string,
): Promise<string> {
  const isGif = mimeType === "image/gif";
  const form = new FormData();
  form.set(
    "media",
    new Blob([asArrayBuffer(bytes)], { type: mimeType }),
    isGif ? "image.gif" : "image.jpg",
  );
  form.set("media_category", isGif ? "tweet_gif" : "tweet_image");
  const res = await fetch("https://api.x.com/2/media/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = await parseJson<Record<string, unknown>>(res);
  if (!res.ok)
    throw new Error(
      extractXError(json, `X image upload failed: ${res.status}`),
    );
  return mediaIdFrom(json, `X image upload failed: ${res.status}`);
}

async function uploadVideoToX(
  url: string,
  mimeType: string,
  accessToken: string,
  totalBytes: number,
  onReady?: (mediaId: string) => Promise<void>,
): Promise<string> {
  const initRes = await fetch("https://api.x.com/2/media/upload/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      media_type: mimeType || "video/mp4",
      total_bytes: totalBytes,
      media_category: "tweet_video",
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const initJson = await parseJson<Record<string, unknown>>(initRes);
  if (!initRes.ok)
    throw new Error(
      extractXError(initJson, `X video INIT failed: ${initRes.status}`),
    );
  const mediaId = mediaIdFrom(
    initJson,
    `X video INIT failed: ${initRes.status}`,
  );

  const CHUNK = 1024 * 1024;
  let segmentIndex = 0;
  for (let offset = 0; offset < totalBytes; offset += CHUNK) {
    const end = Math.min(offset + CHUNK, totalBytes) - 1;
    const source = await fetch(url, {
      headers: {
        Range: `bytes=${offset}-${end}`,
        "accept-encoding": "identity",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    let chunk: Uint8Array;
    if (source.status === 206) {
      chunk = new Uint8Array(await source.arrayBuffer());
    } else if (source.status === 200) {
      // The storage backend ignored Range and sent the whole object — slice it.
      chunk = new Uint8Array(await source.arrayBuffer()).subarray(
        offset,
        end + 1,
      );
      if (chunk.length !== end - offset + 1) {
        throw new Error("Media storage returned a truncated video body");
      }
    } else {
      throw new Error(`X video download failed: ${source.status}`);
    }
    const form = new FormData();
    form.set("segment_index", String(segmentIndex));
    form.set(
      "media",
      new Blob([asArrayBuffer(chunk)], { type: mimeType }),
      `chunk-${segmentIndex}`,
    );
    const appendRes = await fetch(
      `https://api.x.com/2/media/upload/${mediaId}/append`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!appendRes.ok) {
      const json = await parseJson<Record<string, unknown>>(appendRes);
      throw new Error(
        extractXError(json, `X video APPEND failed: ${appendRes.status}`),
      );
    }
    segmentIndex += 1;
  }

  const finalizeRes = await fetch(
    `https://api.x.com/2/media/upload/${mediaId}/finalize`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  const finalizeJson = await parseJson<Record<string, unknown>>(finalizeRes);
  if (!finalizeRes.ok) {
    throw new Error(
      extractXError(
        finalizeJson,
        `X video FINALIZE failed: ${finalizeRes.status}`,
      ),
    );
  }

  const processingInfo = (finalizeJson.processing_info ??
    (finalizeJson.data as Record<string, unknown> | undefined)
      ?.processing_info) as
    | {
        state?: string;
        check_after_secs?: number;
        error?: { message?: string };
      }
    | undefined;
  if (
    !processingInfo ||
    processingInfo.state === "succeeded" ||
    !processingInfo.state
  ) {
    return mediaId;
  }
  if (processingInfo.state === "failed") {
    throw new Error(
      processingInfo.error?.message ?? "X video processing failed",
    );
  }
  await onReady?.(mediaId);

  return waitForXVideo(
    mediaId,
    accessToken,
    processingInfo.check_after_secs ?? 2,
  );
}

async function waitForXVideo(
  mediaId: string,
  accessToken: string,
  firstWaitSecs = 2,
) {
  let waitedMs = 0;
  let nextWaitMs = firstWaitSecs * 1000;
  while (waitedMs < 7 * 60 * 1000) {
    await new Promise((resolve) => setTimeout(resolve, nextWaitMs));
    waitedMs += nextWaitMs;
    const statusRes = await fetch(
      `https://api.x.com/2/media/upload?command=STATUS&media_id=${encodeURIComponent(mediaId)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    const statusJson = await parseJson<{
      data?: {
        processing_info?: {
          state?: string;
          error?: { message?: string };
          check_after_secs?: number;
        };
      };
      processing_info?: {
        state?: string;
        error?: { message?: string };
        check_after_secs?: number;
      };
    }>(statusRes);
    if (!statusRes.ok) {
      throw new Error(
        extractXError(statusJson, `X video STATUS failed: ${statusRes.status}`),
      );
    }
    const info = statusJson.processing_info ?? statusJson.data?.processing_info;
    if (!info?.state || info.state === "succeeded") return mediaId;
    if (info.state === "failed") {
      throw new Error(info.error?.message ?? "X video processing failed");
    }
    nextWaitMs = (info.check_after_secs ?? 2) * 1000;
  }
  throw new ResumablePublishError("X video is still processing");
}

async function uploadMediaToX(
  asset: Doc<"mediaAssets">,
  accessToken: string,
  onVideoReady?: (mediaId: string) => Promise<void>,
): Promise<string> {
  const url = asset.publicUrl ?? asset.externalUrl;
  if (!url) throw new Error(`X media URL missing for ${asset.filename}`);
  if (asset.kind === "video" || asset.mimeType.startsWith("video/")) {
    if (!asset.sizeBytes)
      throw new Error(`X video size missing for ${asset.filename}`);
    return uploadVideoToX(
      url,
      asset.mimeType,
      accessToken,
      asset.sizeBytes,
      onVideoReady,
    );
  }
  const { bytes, mimeType } = await downloadBytes(url);
  return uploadImageToX(bytes, accessToken, mimeType || asset.mimeType);
}

export async function publishToX(params: PublishInput): Promise<PublishedPost> {
  const {
    post,
    target,
    account,
    media,
    accessToken,
    existingAttempt,
    saveAttempt,
  } = params;
  const alreadyPublished = publishedFromAttempt(existingAttempt);
  if (alreadyPublished) return alreadyPublished;

  const text = effectiveCaption(post.body, target.bodyOverride);
  if (!text && media.length === 0)
    throw new Error("X post requires text or media");

  let mediaIds =
    existingAttempt?.kind === "x" ? existingAttempt.mediaIds : undefined;
  const hasVideo = media.some(
    (asset) => asset.kind === "video" || asset.mimeType.startsWith("video/"),
  );
  if (mediaIds?.length && hasVideo) {
    for (const mediaId of mediaIds) {
      await waitForXVideo(mediaId, accessToken, 0);
    }
  } else if (!mediaIds?.length && media.length > 0) {
    const toUpload = media.slice(0, 4);
    const ids: string[] = [];
    for (const m of toUpload) {
      ids.push(
        await uploadMediaToX(m, accessToken, async (mediaId) => {
          await saveAttempt?.({ kind: "x", mediaIds: [...ids, mediaId] });
        }),
      );
    }
    mediaIds = ids;
    await saveAttempt?.({ kind: "x", mediaIds });
  }

  const payload: Record<string, unknown> = { text };
  if (mediaIds?.length) payload.media = { media_ids: mediaIds };

  const replyId = tweetIdFromUrl(target.referenceUrl);
  if (replyId) payload.reply = { in_reply_to_tweet_id: replyId };

  const res = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const json = await parseJson<{
    data?: { id?: string };
    errors?: Array<{ message?: string; detail?: string }>;
    detail?: string;
    title?: string;
  }>(res);

  if (!res.ok || !json.data?.id) {
    throw new Error(extractXError(json, `X post failed: ${res.status}`));
  }

  const id = json.data.id;
  const handle = account.username?.trim();
  const permalink = handle
    ? `https://x.com/${handle}/status/${id}`
    : `https://x.com/i/web/status/${id}`;
  await saveAttempt?.({ kind: "x", platformPostId: id, permalink, mediaIds });
  return { platformPostId: id, permalink };
}
