import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { requireUser } from "../hexclave/auth";

export const r2 = new R2(components.r2);

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

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
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    if (!args.filename.trim()) {
      throw new Error("Filename is required");
    }
    if (args.sizeBytes < 0 || args.sizeBytes > MAX_UPLOAD_BYTES) {
      throw new Error("Invalid file size");
    }
    if (!args.mimeType.includes("/")) {
      throw new Error("Invalid MIME type");
    }

    // Ensure the object exists in our R2 component metadata.
    const meta = await r2.getMetadata(ctx, args.r2Key);
    if (!meta) {
      throw new Error(
        "Upload not found. Complete the upload before confirming.",
      );
    }

    if (meta.size != null && meta.size > MAX_UPLOAD_BYTES) {
      throw new Error("File exceeds maximum size");
    }

    const owned = await ctx.db
      .query("mediaAssets")
      .withIndex("by_r2_key", (q) => q.eq("r2Key", args.r2Key))
      .unique();

    if (owned && owned.teamId !== user.selectedTeamId) {
      throw new Error("Upload not found");
    }

    // Prefer server-side URL from R2; never trust an arbitrary client URL.
    const publicUrl = meta.url || meta.link || undefined;
    const sizeBytes = meta.size ?? args.sizeBytes;
    const mimeType = meta.contentType ?? args.mimeType;

    if (owned) {
      await ctx.db.patch(owned._id, {
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
    }

    // Fallback if onUpload did not run (e.g. older client path).
    return await ctx.db.insert("mediaAssets", {
      teamId: user.selectedTeamId,
      r2Key: args.r2Key,
      publicUrl,
      kind: kindFromMime(mimeType),
      filename: args.filename.trim(),
      mimeType,
      sizeBytes,
      width: args.width,
      height: args.height,
      durationMs: args.durationMs,
      status: "ready",
      createdByUserId: user.id,
      createdAt: now,
    });
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
