"use node";

import type { PublishInput, PublishedPost } from "./helpers";
import {
  effectiveCaption,
  publishedFromAttempt,
  youtubePrivacy,
} from "./helpers";

const TIMEOUT = 8 * 60 * 1000;

export async function publishToYoutube(
  params: PublishInput,
): Promise<PublishedPost> {
  const { post, target, media, accessToken, existingAttempt, saveAttempt } =
    params;
  const alreadyPublished = publishedFromAttempt(existingAttempt);
  if (alreadyPublished) return alreadyPublished;
  if (existingAttempt?.kind === "youtube") {
    throw new Error(
      "YouTube may have already received this upload. Check the channel before retrying.",
    );
  }

  if (post.kind !== "video") throw new Error("Unsupported kind for YouTube");

  const asset = media[0];
  if (!asset) throw new Error("YouTube video missing");
  if (asset.kind !== "video") throw new Error("Unsupported kind for YouTube");

  const url = asset.publicUrl ?? asset.externalUrl;
  if (!url) throw new Error("YouTube video URL missing");

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
  await saveAttempt?.({ kind: "youtube", uploadStarted: true });

  const dl = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!dl.ok) throw new Error(`Video download failed: ${dl.status}`);
  if (!dl.body) throw new Error("Video download returned an empty body");

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": asset.mimeType || "video/mp4",
      "Content-Length": String(asset.sizeBytes),
    },
    body: dl.body,
    duplex: "half",
    signal: AbortSignal.timeout(TIMEOUT),
  } as RequestInit);

  const putJson = (await putRes.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };
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
