"use node";

import type { Doc } from "../_generated/dataModel";

const TIMEOUT_MS = 15_000;

function effectiveBody(post: Doc<"posts">, target: Doc<"postTargets">): string {
  return (target.bodyOverride?.trim() ?? post.body.trim()).trim();
}

function getAuthorUrn(account: Doc<"connectedAccounts">): string {
  const meta = account.metadata as Record<string, unknown> | undefined;
  if (meta) {
    const candidate =
      (meta.authorUrn as string | undefined) ??
      (meta.author as string | undefined) ??
      (meta.urn as string | undefined);
    if (typeof candidate === "string" && candidate.startsWith("urn:li:")) {
      return candidate;
    }
    const orgId = (meta.organizationId ?? meta.organizationUrn) as string | undefined;
    if (typeof orgId === "string" && orgId) {
      return orgId.startsWith("urn:li:") ? orgId : `urn:li:organization:${orgId}`;
    }
  }
  return `urn:li:person:${account.providerAccountId}`;
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
  if (typeof p.serviceErrorCode === "string" && typeof p.message === "string") {
    return `${p.serviceErrorCode}: ${p.message}`;
  }
  return fallback;
}

async function registerUpload(
  accessToken: string,
  authorUrn: string,
  recipe: string,
): Promise<{ asset: string; uploadUrl: string }> {
  const res = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: [recipe],
        owner: authorUrn,
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
        ],
      },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const json = await parseJson<{
    value?: {
      asset?: string;
      uploadMechanism?: {
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"?: { uploadUrl?: string };
      };
    };
    message?: string;
    detail?: string;
  }>(res);

  const asset = json.value?.asset;
  const uploadUrl =
    json.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;

  if (!res.ok || !asset || !uploadUrl) {
    throw new Error(extractError(json, `LinkedIn registerUpload failed: ${res.status}`));
  }

  return { asset, uploadUrl };
}

async function putBytes(
  uploadUrl: string,
  bytes: Uint8Array,
  mimeType: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": mimeType || "application/octet-stream",
    },
    body: bytes as any,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LinkedIn media upload failed: ${res.status} ${text.slice(0, 500)}`);
  }
}

async function downloadBytes(url: string): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Media download failed: ${res.status} ${res.statusText}`);
  const mimeType = res.headers.get("content-type") ?? "application/octet-stream";
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length === 0) throw new Error("Media download returned empty body");
  return { bytes, mimeType };
}

export async function publishToLinkedIn(params: {
  post: Doc<"posts">;
  target: Doc<"postTargets">;
  account: Doc<"connectedAccounts">;
  media: Doc<"mediaAssets">[];
  accessToken: string;
}): Promise<{ platformPostId: string; permalink?: string }> {
  const { post, target, account, media, accessToken } = params;

  const text = effectiveBody(post, target);
  const author = getAuthorUrn(account);

  const uploaded: Array<{ asset: string; title: string }> = [];

  for (const asset of media) {
    const url = asset.publicUrl ?? asset.externalUrl;
    if (!url) throw new Error(`LinkedIn media URL missing for ${asset.filename}`);
    const recipe =
      asset.kind === "video"
        ? "urn:li:digitalmediaRecipe:feedshare-video"
        : "urn:li:digitalmediaRecipe:feedshare-image";

    const { asset: urn, uploadUrl } = await registerUpload(accessToken, author, recipe);
    const { bytes } = await downloadBytes(url);
    const mime = asset.mimeType || (asset.kind === "video" ? "video/mp4" : "image/jpeg");
    await putBytes(uploadUrl, bytes, mime, accessToken);
    uploaded.push({ asset: urn, title: asset.filename });
  }

  const shareMediaCategory =
    uploaded.length === 0 ? "NONE" : media.some((m) => m.kind === "video") ? "VIDEO" : "IMAGE";

  const shareContent: Record<string, unknown> = {
    shareCommentary: { text },
    shareMediaCategory,
  };

  if (uploaded.length > 0) {
    shareContent.media = uploaded.map((u) => ({
      status: "READY",
      media: u.asset,
      description: u.title ? { text: u.title.slice(0, 300) } : undefined,
      title: u.title ? { text: u.title.slice(0, 200) } : undefined,
    }));
  }

  const body = {
    author,
    lifecycleState: "PUBLISHED",
    specificContent: { "com.linkedin.ugc.ShareContent": shareContent },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const json = await parseJson<{ id?: string; message?: string; detail?: string }>(res);

  if (!res.ok || !json.id) {
    throw new Error(extractError(json, `LinkedIn post failed: ${res.status}`));
  }

  return {
    platformPostId: json.id,
    permalink: `https://www.linkedin.com/feed/update/${encodeURIComponent(json.id)}`,
  };
}

// Alias for callers using lowercase naming.
export const publishToLinkedin = publishToLinkedIn;
