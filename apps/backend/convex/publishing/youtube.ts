"use node";

import type { Doc } from "../_generated/dataModel";

const TIMEOUT = 30_000;

function effectiveBody(post: Doc<"posts">, target: Doc<"postTargets">): string {
  return (target.bodyOverride?.trim() || post.body?.trim() || "").trim();
}

function toYouTubePrivacy(visibility?: string): string {
  if (visibility === "private") return "private";
  if (visibility === "unlisted") return "unlisted";
  return "public";
}

export async function publishToYoutube(params: {
  post: Doc<"posts">;
  target: Doc<"postTargets">;
  account: Doc<"connectedAccounts">;
  media: Doc<"mediaAssets">[];
  accessToken: string;
}): Promise<{ platformPostId: string; permalink?: string }> {
  const { post, target, media, accessToken } = params;

  if (post.kind !== "video") throw new Error("Unsupported kind for YouTube");

  const asset = media[0];
  if (!asset) throw new Error("YouTube video missing");
  if (asset.kind !== "video") throw new Error("Unsupported kind for YouTube");

  const url = asset.publicUrl ?? (asset as unknown as { externalUrl?: string }).externalUrl;
  if (!url) throw new Error("YouTube video URL missing");

  const body = effectiveBody(post, target);
  const title =
    (target.platformSettings?.title?.trim() ||
      post.title?.trim() ||
      body.slice(0, 100).trim() ||
      "Untitled").slice(0, 100) || "Untitled";

  const snippet = {
    title,
    description: body,
    tags: [] as string[],
    categoryId: "22",
  };

  const status: Record<string, unknown> = {
    privacyStatus: toYouTubePrivacy(target.platformSettings?.visibility),
    selfDeclaredMadeForKids: target.platformSettings?.madeForKids ?? false,
  };
  if (typeof target.platformSettings?.notifySubscribers === "boolean") {
    status.notifySubscribers = target.platformSettings.notifySubscribers;
  }

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
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

  const uploadUrl = initRes.headers.get("Location") ?? initRes.headers.get("location");
  if (!uploadUrl) throw new Error("YouTube: no upload URL");

  const dl = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!dl.ok) throw new Error(`Video download failed: ${dl.status}`);
  const bytes = new Uint8Array(await dl.arrayBuffer());

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": asset.mimeType || "video/mp4",
      "Content-Length": String(bytes.byteLength),
    },
    body: bytes as unknown as never,
    signal: AbortSignal.timeout(TIMEOUT),
  });

  const putJson = (await putRes.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };
  if (!putRes.ok || !putJson.id) {
    throw new Error(putJson.error?.message ?? `YouTube upload failed: ${putRes.status}`);
  }

  return { platformPostId: putJson.id, permalink: `https://www.youtube.com/watch?v=${putJson.id}` };
}
