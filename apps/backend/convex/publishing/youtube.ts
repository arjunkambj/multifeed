"use node";

import type { Doc } from "../_generated/dataModel";
import type { PublishInput, PublishedPost } from "./helpers";
import {
  effectiveCaption,
  publishedFromAttempt,
  ResumablePublishError,
  youtubePrivacy,
} from "./helpers";

const TIMEOUT = 8 * 60 * 1000;

/** Drop the first `count` bytes from a stream without buffering it. */
function dropBytes(stream: ReadableStream<Uint8Array>, count: number) {
  const reader = stream.getReader();
  let remaining = count;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        if (remaining >= value.byteLength) {
          remaining -= value.byteLength;
          continue;
        }
        controller.enqueue(
          remaining > 0 ? value.subarray(remaining) : value,
        );
        remaining = 0;
        return;
      }
    },
    cancel() {
      return reader.cancel();
    },
  });
}

async function finishUpload(
  putRes: Response,
  saveAttempt: PublishInput["saveAttempt"],
): Promise<PublishedPost> {
  const putJson = (await putRes.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };
  if (putRes.status === 308) {
    // Resumable session still incomplete — the saved uploadUrl will resume it.
    throw new ResumablePublishError("YouTube upload is still incomplete");
  }
  if (!putRes.ok || !putJson.id) {
    throw new Error(
      putJson.error?.message ?? `YouTube upload failed: ${putRes.status}`,
    );
  }
  const permalink = `https://www.youtube.com/watch?v=${putJson.id}`;
  await saveAttempt?.({
    kind: "youtube",
    platformPostId: putJson.id,
    permalink,
  });
  return { platformPostId: putJson.id, permalink };
}

/**
 * Resume an interrupted resumable upload session. Returns null when the
 * session is gone or unusable so the caller can start a fresh one.
 */
async function resumeYoutubeUpload(
  uploadUrl: string,
  sourceUrl: string,
  asset: Doc<"mediaAssets">,
  accessToken: string,
  saveAttempt: PublishInput["saveAttempt"],
): Promise<PublishedPost | null> {
  const size = asset.sizeBytes;
  const statusRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Length": "0",
      "Content-Range": `bytes */${size}`,
    },
    signal: AbortSignal.timeout(TIMEOUT),
  });

  if (statusRes.ok) {
    // The upload actually finished — the body carries the video resource.
    const json = (await statusRes.json().catch(() => ({}))) as {
      id?: string;
    };
    if (!json.id) return null;
    const permalink = `https://www.youtube.com/watch?v=${json.id}`;
    await saveAttempt?.({
      kind: "youtube",
      platformPostId: json.id,
      permalink,
    });
    return { platformPostId: json.id, permalink };
  }
  if (statusRes.status === 404 || statusRes.status === 410) {
    return null; // Session expired; start over.
  }
  if (statusRes.status !== 308) {
    if (statusRes.status >= 500) {
      throw new ResumablePublishError(
        `YouTube upload status check failed: ${statusRes.status}`,
      );
    }
    return null; // Unusable session; start over.
  }

  const range = statusRes.headers.get("range");
  const match = range?.match(/bytes=0-(\d+)/);
  const received = match ? Number(match[1]) + 1 : 0;
  if (received >= size) return null;

  const dl = await fetch(sourceUrl, {
    headers:
      received > 0
        ? { Range: `bytes=${received}-${size - 1}`, "accept-encoding": "identity" }
        : { "accept-encoding": "identity" },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!dl.ok) throw new Error(`Video download failed: ${dl.status}`);
  if (!dl.body) throw new Error("Video download returned an empty body");

  // A 206 honors the Range; a 200 sends the whole object, so skip the bytes
  // YouTube already received instead of restarting the session.
  const body =
    dl.status === 200 && received > 0 ? dropBytes(dl.body, received) : dl.body;

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": asset.mimeType || "video/mp4",
      "Content-Length": String(size - received),
      "Content-Range": `bytes ${received}-${size - 1}/${size}`,
    },
    body,
    duplex: "half",
    signal: AbortSignal.timeout(TIMEOUT),
  } as RequestInit);

  return finishUpload(putRes, saveAttempt);
}

export async function publishToYoutube(
  params: PublishInput,
): Promise<PublishedPost> {
  const { post, target, media, accessToken, existingAttempt, saveAttempt } =
    params;
  const alreadyPublished = publishedFromAttempt(existingAttempt);
  if (alreadyPublished) return alreadyPublished;

  if (post.kind !== "video") throw new Error("Unsupported kind for YouTube");

  const asset = media[0];
  if (!asset) throw new Error("YouTube video missing");
  if (asset.kind !== "video") throw new Error("Unsupported kind for YouTube");

  const url = asset.publicUrl ?? asset.externalUrl;
  if (!url) throw new Error("YouTube video URL missing");

  const youtubeAttempt =
    existingAttempt?.kind === "youtube" ? existingAttempt : undefined;
  if (youtubeAttempt?.uploadUrl) {
    const resumed = await resumeYoutubeUpload(
      youtubeAttempt.uploadUrl,
      url,
      asset,
      accessToken,
      saveAttempt,
    );
    if (resumed) return resumed;
    // The session expired or is unusable — start a fresh one below.
  } else if (youtubeAttempt) {
    // Checkpoints written before resumable support cannot be verified.
    throw new Error(
      "YouTube may have already received this upload. Check the channel before retrying.",
    );
  }

  const body = effectiveCaption(post.body, target.bodyOverride);
  const title =
    (
      target.platformSettings?.title?.trim() ||
      post.title?.trim() ||
      body.slice(0, 100).trim() ||
      "Untitled"
    ).slice(0, 100) || "Untitled";

  const snippet = {
    title,
    description: body,
    tags: [] as string[],
    categoryId: "22",
  };

  const status = {
    privacyStatus: youtubePrivacy(target.platformSettings?.visibility),
    selfDeclaredMadeForKids: target.platformSettings?.madeForKids ?? false,
  };
  const notifySubscribers = target.platformSettings?.notifySubscribers ?? true;

  const initRes = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status&notifySubscribers=${notifySubscribers ? "true" : "false"}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": asset.mimeType || "video/mp4",
        "X-Upload-Content-Length": String(asset.sizeBytes),
      },
      body: JSON.stringify({ snippet, status }),
      signal: AbortSignal.timeout(TIMEOUT),
    },
  );

  if (!initRes.ok) {
    const text = await initRes.text().catch(() => "");
    let msg = `YouTube init failed: ${initRes.status}`;
    try {
      const j = JSON.parse(text) as { error?: { message?: string } };
      if (j.error?.message) msg = j.error.message;
    } catch {
      if (text) msg = `${msg} ${text.slice(0, 800)}`;
    }
    throw new Error(msg);
  }

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) throw new Error("YouTube: no upload URL");
  // Persist the session URL before uploading so a crash can resume it.
  await saveAttempt?.({ kind: "youtube", uploadStarted: true, uploadUrl });

  const dl = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!dl.ok) throw new Error(`Video download failed: ${dl.status}`);
  if (!dl.body) throw new Error("Video download returned an empty body");

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": asset.mimeType || "video/mp4",
      "Content-Length": String(asset.sizeBytes),
      "Content-Range": `bytes 0-${asset.sizeBytes - 1}/${asset.sizeBytes}`,
    },
    body: dl.body,
    duplex: "half",
    signal: AbortSignal.timeout(TIMEOUT),
  } as RequestInit);

  return finishUpload(putRes, saveAttempt);
}
