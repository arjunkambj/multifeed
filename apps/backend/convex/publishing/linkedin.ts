"use node";

import type { PublishInput, PublishedPost } from "./helpers";
import { LINKEDIN_VERSION } from "./apiVersions";
import {
  effectiveCaption,
  linkedinAuthorUrn,
  publishedFromAttempt,
  ResumablePublishError,
} from "./helpers";

const TIMEOUT_MS = 8 * 60 * 1000;
const VIDEO_CHUNK = 2 * 1024 * 1024;

function headers(accessToken: string, extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": LINKEDIN_VERSION,
    ...extra,
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

function extractError(payload: unknown, fallback: string): string {
  if (typeof payload !== "object" || payload === null) return fallback;
  const p = payload as Record<string, unknown>;
  if (typeof p.message === "string") return p.message;
  if (typeof p.detail === "string") return p.detail;
  if (typeof p.error_description === "string") return p.error_description;
  if (typeof p.error === "string") return p.error;
  return fallback;
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

async function initializeUpload(
  accessToken: string,
  author: string,
  kind: "image" | "video",
  fileSizeBytes?: number,
) {
  const endpoint = kind === "video" ? "videos" : "images";
  const res = await fetch(
    `https://api.linkedin.com/rest/${endpoint}?action=initializeUpload`,
    {
      method: "POST",
      headers: headers(accessToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: author,
          ...(kind === "video"
            ? {
                fileSizeBytes,
                uploadCaptions: false,
                uploadThumbnail: false,
              }
            : {}),
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  const json = await parseJson<{
    value?: {
      uploadUrl?: string;
      image?: string;
      video?: string;
      uploadInstructions?: Array<{ uploadUrl?: string }>;
    };
    message?: string;
  }>(res);
  const uploadUrl =
    json.value?.uploadInstructions?.[0]?.uploadUrl ?? json.value?.uploadUrl;
  const urn = json.value?.video ?? json.value?.image;
  if (!res.ok || !uploadUrl || !urn) {
    throw new Error(
      extractError(json, `LinkedIn initializeUpload failed: ${res.status}`),
    );
  }
  return { uploadUrl, urn };
}

async function uploadImage(
  uploadUrl: string,
  bytes: Uint8Array,
  accessToken: string,
  mimeType: string,
) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: headers(accessToken, {
      "Content-Type": mimeType || "application/octet-stream",
    }),
    body: asArrayBuffer(bytes),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `LinkedIn image upload failed: ${res.status} ${text.slice(0, 500)}`,
    );
  }
}

async function uploadVideo(
  uploadUrl: string,
  sourceUrl: string,
  sizeBytes: number,
  accessToken: string,
  urn: string,
) {
  const etags: string[] = [];
  for (let start = 0; start < sizeBytes; start += VIDEO_CHUNK) {
    const end = Math.min(start + VIDEO_CHUNK, sizeBytes) - 1;
    const source = await fetch(sourceUrl, {
      headers: {
        Range: `bytes=${start}-${end}`,
        "accept-encoding": "identity",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (source.status !== 206) {
      throw new Error(
        source.status === 200
          ? "Media storage did not return the requested video range"
          : `LinkedIn video download failed: ${source.status}`,
      );
    }
    const chunk = new Uint8Array(await source.arrayBuffer());
    const upload = await fetch(uploadUrl, {
      method: "PUT",
      headers: headers(accessToken, {
        "Content-Type": "application/octet-stream",
      }),
      body: asArrayBuffer(chunk),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!upload.ok) {
      const text = await upload.text().catch(() => "");
      throw new Error(
        `LinkedIn video upload failed: ${upload.status} ${text.slice(0, 500)}`,
      );
    }
    const etag = upload.headers.get("etag");
    if (!etag) throw new Error("LinkedIn video upload did not return an etag");
    etags.push(etag);
  }
  const finalize = await fetch(
    "https://api.linkedin.com/rest/videos?action=finalizeUpload",
    {
      method: "POST",
      headers: headers(accessToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        finalizeUploadRequest: {
          video: urn,
          uploadToken: "",
          uploadedPartIds: etags,
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!finalize.ok) {
    const json = await parseJson<Record<string, unknown>>(finalize);
    throw new Error(
      extractError(json, `LinkedIn finalizeUpload failed: ${finalize.status}`),
    );
  }
}

async function waitForImageGrace() {
  await new Promise((resolve) => setTimeout(resolve, 8000));
}

async function waitForVideo(accessToken: string, urn: string) {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const res = await fetch(
      `https://api.linkedin.com/rest/videos/${encodeURIComponent(urn)}`,
      {
        headers: headers(accessToken),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    const json = await parseJson<{
      status?: string;
      processingFailureReason?: string;
      message?: string;
    }>(res);
    if (json.status === "AVAILABLE" || json.status === "READY") return;
    if (json.status === "FAILED" || json.processingFailureReason) {
      throw new Error(
        json.processingFailureReason ??
          extractError(json, "LinkedIn video processing failed"),
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new ResumablePublishError("LinkedIn video is still processing");
}

function postContent(mediaIds: string[]) {
  if (mediaIds.length === 0) return {};
  if (mediaIds.length === 1) {
    return { content: { media: { id: mediaIds[0] } } };
  }
  return {
    content: {
      multiImage: {
        images: mediaIds.map((id) => ({ id })),
      },
    },
  };
}

export async function publishToLinkedIn(
  params: PublishInput,
): Promise<PublishedPost> {
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
  const author = linkedinAuthorUrn(
    account.providerAccountId,
    account.metadata as Record<string, unknown> | undefined,
  );
  const existingIds = Array.isArray(existingAttempt?.mediaIds)
    ? existingAttempt.mediaIds.filter(
        (id): id is string => typeof id === "string",
      )
    : [];
  const mediaIds: string[] = existingIds;

  if (existingIds.length > 0 && media.some((asset) => asset.kind === "video")) {
    await Promise.all(
      existingIds
        .filter((urn) => urn.includes(":video:"))
        .map((urn) => waitForVideo(accessToken, urn)),
    );
  }

  if (mediaIds.length === 0) {
    for (const asset of media) {
      const url = asset.publicUrl ?? asset.externalUrl;
      if (!url)
        throw new Error(`LinkedIn media URL missing for ${asset.filename}`);
      if (asset.kind === "video") {
        const { uploadUrl, urn } = await initializeUpload(
          accessToken,
          author,
          "video",
          asset.sizeBytes,
        );
        await uploadVideo(uploadUrl, url, asset.sizeBytes, accessToken, urn);
        mediaIds.push(urn);
        await saveAttempt?.({ kind: "linkedin", mediaIds: [...mediaIds] });
        await waitForVideo(accessToken, urn);
      } else {
        const source = await fetch(url, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!source.ok)
          throw new Error(`Media download failed: ${source.status}`);
        const bytes = new Uint8Array(await source.arrayBuffer());
        const { uploadUrl, urn } = await initializeUpload(
          accessToken,
          author,
          "image",
        );
        await uploadImage(uploadUrl, bytes, accessToken, asset.mimeType);
        mediaIds.push(urn);
        await saveAttempt?.({ kind: "linkedin", mediaIds: [...mediaIds] });
        await waitForImageGrace();
      }
    }
  }

  const payload = {
    author,
    commentary: text,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [] as string[],
      thirdPartyDistributionChannels: [] as string[],
    },
    ...postContent(mediaIds),
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: headers(accessToken, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = await parseJson<{ id?: string; message?: string }>(res);
  const id = res.headers.get("x-restli-id") ?? json.id;
  if ((!res.ok && res.status !== 201) || !id) {
    throw new Error(extractError(json, `LinkedIn post failed: ${res.status}`));
  }
  const permalink = `https://www.linkedin.com/feed/update/${encodeURIComponent(id)}`;
  await saveAttempt?.({
    kind: "linkedin",
    platformPostId: id,
    permalink,
    mediaIds,
  });
  return { platformPostId: id, permalink };
}
