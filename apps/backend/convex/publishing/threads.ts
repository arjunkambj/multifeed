"use node";

import type { PublishInput, PublishedPost } from "./helpers";
import { THREADS_GRAPH } from "./apiVersions";
import {
  effectiveCaption,
  publishedFromAttempt,
  ResumablePublishError,
} from "./helpers";

const GRAPH = THREADS_GRAPH;
const TIMEOUT = 30_000;

type ThreadsResponse = {
  id?: string;
  permalink?: string;
  status?: string;
  error?: { message?: string };
  error_message?: string;
  message?: string;
};

async function gfetch(
  url: string,
  init: RequestInit,
): Promise<ThreadsResponse> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT),
  });
  const json = (await res.json().catch(() => ({}))) as ThreadsResponse;
  if (!res.ok) {
    const msg =
      json.error?.message ??
      json.error_message ??
      json.message ??
      `HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  return json;
}

export async function publishToThreads(
  params: PublishInput,
): Promise<PublishedPost> {
  const { post, target, media, accessToken, existingAttempt, saveAttempt } =
    params;
  const alreadyPublished = publishedFromAttempt(existingAttempt);
  if (alreadyPublished) return alreadyPublished;
  const text = effectiveCaption(post.body, target.bodyOverride);
  const userId = params.account.providerAccountId;
  if (!userId) throw new Error("Threads user ID missing");

  async function createContainer(
    extra: Record<string, string>,
  ): Promise<string> {
    const body = new URLSearchParams({ access_token: accessToken, ...extra });
    const data = await gfetch(`${GRAPH}/${userId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!data.id) throw new Error("Threads container creation failed");
    return data.id;
  }

  async function publishContainer(creationId: string): Promise<string> {
    const data = await gfetch(`${GRAPH}/${userId}/threads_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken,
      }),
    });
    if (!data.id) throw new Error("Threads publish failed");
    return data.id;
  }

  async function permalinkFor(id: string): Promise<string | undefined> {
    const data = await gfetch(
      `${GRAPH}/${id}?fields=permalink&access_token=${encodeURIComponent(accessToken)}`,
      { method: "GET" },
    ).catch((): ThreadsResponse => ({}));
    return typeof data.permalink === "string" ? data.permalink : undefined;
  }

  async function waitForContainer(creationId: string) {
    for (let attempt = 0; attempt < 15; attempt += 1) {
      const data = await gfetch(
        `${GRAPH}/${creationId}?fields=status,error_message&access_token=${encodeURIComponent(accessToken)}`,
        { method: "GET" },
      ).catch((): ThreadsResponse => ({ status: "IN_PROGRESS" }));
      const status = String(data.status ?? "").toUpperCase();
      if (status === "PUBLISHED") return "published" as const;
      if (status === "FINISHED") return "ready" as const;
      if (status === "ERROR" || status === "EXPIRED") {
        throw new Error(
          data.error_message || `Threads media processing failed (${status})`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
    throw new ResumablePublishError("Threads media is still processing");
  }

  async function finish(cid: string) {
    await saveAttempt?.({ kind: "threads", creationId: cid });
    const state = await waitForContainer(cid);
    const id = state === "published" ? cid : await publishContainer(cid);
    const permalink = await permalinkFor(id);
    await saveAttempt?.({
      kind: "threads",
      platformPostId: id,
      permalink,
      creationId: cid,
    });
    return { platformPostId: id, permalink };
  }

  if (typeof existingAttempt?.creationId === "string") {
    return finish(existingAttempt.creationId);
  }

  // Text-only
  if (post.kind === "text" && media.length === 0) {
    const cid = await createContainer({ media_type: "TEXT", text });
    return finish(cid);
  }

  // Image
  if (post.kind === "image") {
    if (media.length === 0) throw new Error("Image URL missing");
    if (media.length === 1) {
      const url = media[0]!.publicUrl ?? media[0]!.externalUrl;
      if (!url) throw new Error("Image URL missing");
      const cid = await createContainer({
        media_type: "IMAGE",
        image_url: url,
        text,
      });
      return finish(cid);
    }
    // Carousel — create each child with is_carousel_item=true
    const children: string[] = [];
    for (const m of media) {
      const url = m.publicUrl ?? m.externalUrl;
      if (!url) throw new Error("Carousel image URL missing");
      const cid = await createContainer({
        media_type: "IMAGE",
        image_url: url,
        is_carousel_item: "true",
      });
      children.push(cid);
    }
    await Promise.all(children.map((childId) => waitForContainer(childId)));
    const cid = await createContainer({
      media_type: "CAROUSEL",
      children: children.join(","),
      text,
    });
    return finish(cid);
  }

  // Video (including story as video)
  if (post.kind === "video" || post.kind === "story") {
    const m = media[0];
    if (!m) throw new Error("Video missing");
    const url = m.publicUrl ?? m.externalUrl;
    if (!url) throw new Error("Video URL missing");
    const cid = await createContainer({
      media_type: "VIDEO",
      video_url: url,
      text,
    });
    return finish(cid);
  }

  // Fallback for text kind with attached media treated as image/video
  throw new Error(`Threads: unsupported kind ${post.kind}`);
}
