"use node";

import type { Doc } from "../_generated/dataModel";

const TIMEOUT_MS = 15_000;

function effectiveBody(post: Doc<"posts">, target: Doc<"postTargets">): string {
  return (target.bodyOverride?.trim() ?? post.body.trim()).trim();
}

function tweetIdFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (!u.hostname.includes("x.com") && !u.hostname.includes("twitter.com")) {
      // still try to parse - user may paste mobile link
    }
    const match = u.pathname.match(/\/status\/(\d+)/);
    return match?.[1];
  } catch {
    return undefined;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    binary += String.fromCharCode(...(slice as unknown as number[]));
  }
  return btoa(binary);
}

async function downloadBytes(url: string): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Media download failed: ${res.status} ${res.statusText}`);
  const mimeType = res.headers.get("content-type") ?? "application/octet-stream";
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
  if (typeof p.title === "string" && typeof p.detail === "string") return `${p.title}: ${p.detail}`;
  if (typeof p.title === "string") return p.title;
  return fallback;
}

async function uploadImageToX(bytes: Uint8Array, accessToken: string, mimeType: string): Promise<string> {
  const b64 = bytesToBase64(bytes);
  const isGif = mimeType === "image/gif";
  const body = new URLSearchParams({
    media_data: b64,
    media_category: isGif ? "tweet_gif" : "tweet_image",
  });
  const res = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = await parseJson<Record<string, unknown>>(res);
  if (!res.ok || typeof json.media_id_string !== "string") {
    throw new Error(extractXError(json, `X image upload failed: ${res.status}`));
  }
  return json.media_id_string as string;
}

async function uploadVideoToX(bytes: Uint8Array, mimeType: string, accessToken: string): Promise<string> {
  const totalBytes = bytes.length;

  const initRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      command: "INIT",
      total_bytes: String(totalBytes),
      media_type: mimeType || "video/mp4",
      media_category: "tweet_video",
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const initJson = await parseJson<Record<string, unknown>>(initRes);
  if (!initRes.ok || typeof initJson.media_id_string !== "string") {
    throw new Error(extractXError(initJson, `X video INIT failed: ${initRes.status}`));
  }
  const mediaId = initJson.media_id_string as string;

  const CHUNK = 1024 * 1024; // 1 MiB
  let segmentIndex = 0;
  for (let offset = 0; offset < totalBytes; offset += CHUNK) {
    const chunk = bytes.slice(offset, offset + CHUNK);
    const form = new FormData();
    form.set("command", "APPEND");
    form.set("media_id", mediaId);
    form.set("segment_index", String(segmentIndex++));
    form.set("media", new Blob([chunk as unknown as any], { type: mimeType }), `chunk-${segmentIndex}`);

    const appendRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!appendRes.ok) {
      const text = await appendRes.text().catch(() => "");
      const payload = await parseJson<unknown>({ json: async () => { try { return JSON.parse(text); } catch { return {}; } } } as unknown as Response).catch(() => ({}));
      // Prefer parsed error if available, else raw text
      const msg = typeof payload === "object" && payload !== null && "error" in (payload as Record<string, unknown>)
        ? String((payload as Record<string, unknown>).error)
        : text;
      throw new Error(`X video APPEND failed: ${appendRes.status} ${msg.slice(0, 500)}`);
    }
  }

  const finalizeRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ command: "FINALIZE", media_id: mediaId }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const finalizeJson = await parseJson<Record<string, unknown>>(finalizeRes);
  if (!finalizeRes.ok) {
    throw new Error(extractXError(finalizeJson, `X video FINALIZE failed: ${finalizeRes.status}`));
  }

  // Some videos finalize synchronously (no processing_info); otherwise poll STATUS.
  const processingInfo = finalizeJson.processing_info as
    | { state?: string; check_after_secs?: number; error?: { message?: string; name?: string } }
    | undefined;

  if (!processingInfo || processingInfo.state === "succeeded" || !processingInfo.state) {
    return mediaId;
  }

  for (let i = 0; i < 20; i++) {
    const waitSecs = processingInfo?.check_after_secs ?? 2;
    await new Promise((r) => setTimeout(r, Math.min(waitSecs * 1000, 3000)));

    const statusRes = await fetch(
      `https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=${encodeURIComponent(mediaId)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    const statusJson = await parseJson<{
      processing_info?: { state?: string; error?: { message?: string }; check_after_secs?: number };
      error?: string;
    }>(statusRes);

    if (!statusRes.ok) {
      throw new Error(extractXError(statusJson, `X video STATUS failed: ${statusRes.status}`));
    }

    const state = statusJson.processing_info?.state;
    if (!state || state === "succeeded") return mediaId;
    if (state === "failed") {
      throw new Error(statusJson.processing_info?.error?.message ?? "X video processing failed");
    }
  }

  throw new Error("X video processing timed out");
}

async function uploadMediaToX(url: string, accessToken: string): Promise<string> {
  const { bytes, mimeType } = await downloadBytes(url);
  const isVideo = mimeType.startsWith("video/");
  if (isVideo) return uploadVideoToX(bytes, mimeType, accessToken);
  return uploadImageToX(bytes, accessToken, mimeType);
}

export async function publishToX(params: {
  post: Doc<"posts">;
  target: Doc<"postTargets">;
  account: Doc<"connectedAccounts">;
  media: Doc<"mediaAssets">[];
  accessToken: string;
}): Promise<{ platformPostId: string; permalink?: string }> {
  const { post, target, account, media, accessToken } = params;

  const text = effectiveBody(post, target);
  if (!text && media.length === 0) throw new Error("X post requires text or media");

  let mediaIds: string[] | undefined;
  if (media.length > 0) {
    const toUpload = media.slice(0, 4);
    const ids: string[] = [];
    for (const m of toUpload) {
      const url = m.publicUrl ?? m.externalUrl;
      if (!url) throw new Error(`X media URL missing for ${m.filename}`);
      ids.push(await uploadMediaToX(url, accessToken));
    }
    mediaIds = ids;
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
  const permalink = handle ? `https://x.com/${handle}/status/${id}` : `https://x.com/i/web/status/${id}`;
  return { platformPostId: id, permalink };
}
