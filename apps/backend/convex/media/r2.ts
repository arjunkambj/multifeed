import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { requireUser } from "../hexclave/auth";

export const r2 = new R2(components.r2);

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

export const mediaAssetOutputValidator = v.object({
  _id: v.id("mediaAssets"),
  _creationTime: v.number(),
  teamId: v.string(),
  storageId: v.optional(v.id("_storage")),
  r2Key: v.optional(v.string()),
  publicUrl: v.optional(v.string()),
  externalUrl: v.optional(v.string()),
  kind: v.union(
    v.literal("image"),
    v.literal("video"),
    v.literal("document"),
  ),
  filename: v.string(),
  mimeType: v.string(),
  sizeBytes: v.number(),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  durationMs: v.optional(v.number()),
  status: v.union(
    v.literal("uploading"),
    v.literal("ready"),
    v.literal("failed"),
  ),
  createdByUserId: v.string(),
  createdAt: v.number(),
});

export const { generateUploadUrl, syncMetadata } = r2.clientApi<DataModel>({
  checkUpload: async (ctx) => {
    await requireUser(ctx);
  },
  onUpload: async (ctx, _bucket, key) => {
    // Stamp team ownership as soon as the client registers the upload so
    // confirmMediaUpload cannot claim another team's object key.
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("mediaAssets")
      .withIndex("by_r2_key", (q) => q.eq("r2Key", key))
      .unique();
    if (existing) {
      if (existing.teamId !== user.selectedTeamId) {
        throw new Error("Upload key already registered");
      }
      return;
    }
    const now = Date.now();
    await ctx.db.insert("mediaAssets", {
      teamId: user.selectedTeamId,
      r2Key: key,
      kind: "document",
      filename: "pending",
      mimeType: "application/octet-stream",
      sizeBytes: 0,
      status: "uploading",
      createdByUserId: user.id,
      createdAt: now,
    });
  },
});

function kindFromMime(mimeType: string): "image" | "video" | "document" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

/**
 * After R2 upload + syncMetadata, register / finalize asset on the team for posts.
 * Trusts only keys already owned by the team (via onUpload) and R2 metadata.
 */
export const confirmMediaUpload = mutation({
  args: {
    r2Key: v.string(),
    filename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    /** Ignored — public URL is derived from R2 metadata server-side. */
    publicUrl: v.optional(v.string()),
  },
  returns: v.union(v.id("mediaAssets"), v.null()),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (!args.filename.trim() || args.filename.length > 255) {
      throw new Error("Filename is required");
    }
    if (
      !Number.isFinite(args.sizeBytes) ||
      args.sizeBytes < 0 ||
      args.sizeBytes > MAX_UPLOAD_BYTES
    ) {
      throw new Error("Invalid file size");
    }
    if (args.mimeType.length > 255 || !args.mimeType.includes("/")) {
      throw new Error("Invalid MIME type");
    }
    for (const value of [args.width, args.height, args.durationMs]) {
      if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
        throw new Error("Invalid media metadata");
      }
    }

    // Ensure the object exists in our R2 component metadata.
    const meta = await r2.getMetadata(ctx, args.r2Key);
    if (!meta) {
      return null;
    }

    if (meta.size != null && meta.size > MAX_UPLOAD_BYTES) {
      throw new Error("File exceeds maximum size");
    }

    const owned = await ctx.db
      .query("mediaAssets")
      .withIndex("by_r2_key", (q) => q.eq("r2Key", args.r2Key))
      .unique();

    if (!owned) {
      // onUpload has not stamped ownership yet; let the client retry.
      return null;
    }

    if (owned.teamId !== user.selectedTeamId) {
      throw new Error("Upload not found");
    }

    // Prefer server-side URL from R2; never trust an arbitrary client URL.
    const publicUrl = meta.url || meta.link || undefined;
    const sizeBytes = meta.size ?? args.sizeBytes;
    const mimeType = meta.contentType ?? args.mimeType;

    await ctx.db.patch("mediaAssets", owned._id, {
      publicUrl,
      kind: kindFromMime(mimeType),
      filename: args.filename.trim(),
      mimeType,
      sizeBytes,
      width: args.width,
      height: args.height,
      durationMs: args.durationMs,
      status: "ready",
    });
    return owned._id;
  },
});

export const deleteMedia = mutation({
  args: { mediaAssetId: v.id("mediaAssets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const asset = await ctx.db.get("mediaAssets", args.mediaAssetId);
    if (!asset || asset.teamId !== user.selectedTeamId) {
      throw new Error("Media not found");
    }
    if (!asset.r2Key) {
      throw new Error("Media storage key not found");
    }

    const teamPosts = await ctx.db
      .query("posts")
      .withIndex("by_team_updated", (q) => q.eq("teamId", user.selectedTeamId))
      .collect();
    if (
      teamPosts.some((post) => post.mediaAssetIds.includes(args.mediaAssetId))
    ) {
      throw new Error(
        "Remove this media from its saved post before deleting it",
      );
    }

    await r2.deleteObject(ctx, asset.r2Key);
    await ctx.db.delete("mediaAssets", asset._id);
    return null;
  },
});

export const listMedia = query({
  args: {
    kind: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("document"),
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(mediaAssetOutputValidator),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = Math.max(1, Math.min(args.limit ?? 50, 100));

    return await ctx.db
      .query("mediaAssets")
      .withIndex("by_team_status_kind", (q) =>
        q
          .eq("teamId", user.selectedTeamId)
          .eq("status", "ready")
          .eq("kind", args.kind),
      )
      .order("desc")
      .take(limit);
  },
});
