"use node";

import type { Doc } from "../_generated/dataModel";

const GRAPH = "https://graph.threads.net/v1.0";
const TIMEOUT = 30_000;

function effectiveBody(post: Doc<"posts">, target: Doc<"postTargets">): string {
  return (target.bodyOverride?.trim() || post.body?.trim() || "").trim();
}

async function gfetch(url: string, init: RequestInit): Promise<Record<string, string>> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (json as { error?: { message?: string } }).error?.message ??
      (json as { error_message?: string }).error_message ??
      (json as { message?: string }).message ??
      `HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  return json as Record<string, string>;
}

export async function publishToThreads(params: {
  post: Doc<"posts">;
  target: Doc<"postTargets">;
  account: Doc<"connectedAccounts">;
  media: Doc<"mediaAssets">[];
  accessToken: string;
}): Promise<{ platformPostId: string; permalink?: string }> {
  const { post, target, media, accessToken } = params;
  const text = effectiveBody(post, target);
  const userId = params.account.providerAccountId;
  if (!userId) throw new Error("Threads user ID missing");

  async function createContainer(extra: Record<string, string>): Promise<string> {
    const body = new URLSearchParams({ access_token: accessToken, ...extra });
    const data = await gfetch(`${GRAPH}/${userId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!data.id) throw new Error("Threads container creation failed");
    return data.id as string;
  }

  async function publishContainer(creationId: string): Promise<string> {
    const data = await gfetch(`${GRAPH}/${userId}/threads_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ creation_id: creationId, access_token: accessToken }),
    });
    if (!data.id) throw new Error("Threads publish failed");
    return data.id as string;
  }

  // Text-only
  if (post.kind === "text" && media.length === 0) {
    const cid = await createContainer({ media_type: "TEXT", text });
    const id = await publishContainer(cid);
    return { platformPostId: id };
  }

  // Image
  if (post.kind === "image") {
    if (media.length === 0) throw new Error("Image URL missing");
    if (media.length === 1) {
      const url =
        media[0]!.publicUrl ?? (media[0] as unknown as { externalUrl?: string }).externalUrl;
      if (!url) throw new Error("Image URL missing");
      const cid = await createContainer({ media_type: "IMAGE", image_url: url, text });
      const id = await publishContainer(cid);
      return { platformPostId: id };
    }
    // Carousel — create each child with is_carousel_item=true
    const children: string[] = [];
    for (const m of media) {
      const url = m.publicUrl ?? (m as unknown as { externalUrl?: string }).externalUrl;
      if (!url) throw new Error("Carousel image URL missing");
      const cid = await createContainer({
        media_type: "IMAGE",
        image_url: url,
        is_carousel_item: "true",
      });
      children.push(cid);
    }
    const cid = await createContainer({
      media_type: "CAROUSEL",
      children: children.join(","),
      text,
    });
    const id = await publishContainer(cid);
    return { platformPostId: id };
  }

  // Video (including story as video)
  if (post.kind === "video" || post.kind === "story") {
    const m = media[0];
    if (!m) throw new Error("Video missing");
    const url = m.publicUrl ?? (m as unknown as { externalUrl?: string }).externalUrl;
    if (!url) throw new Error("Video URL missing");
    const cid = await createContainer({ media_type: "VIDEO", video_url: url, text });
    // Threads video may need processing — poll publish with backoff
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const id = await publishContainer(cid);
        return { platformPostId: id };
      } catch (e) {
        const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
        if (msg.includes("not ready") || msg.includes("processing") || msg.includes("media not ready")) {
          await new Promise((r) => setTimeout(r, 4000));
          continue;
        }
        throw e;
      }
    }
    throw new Error("Threads video not ready");
  }

  // Fallback for text kind with attached media treated as image/video
  throw new Error(`Threads: unsupported kind ${post.kind}`);
}
