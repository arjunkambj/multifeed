import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import {
  internalMutation,
  mutation,
  type MutationCtx,
  type QueryCtx,
} from "../_generated/server";
import { fail } from "../errors";
import { requireUser } from "../hexclave/auth";
import schema from "../schema";
import { serializeScope } from "../writeGuards";

const r2 = new R2(components.r2);

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB
const STALE_UPLOAD_TTL_MS = 60 * 60 * 1000; // 1 hour
const PURGE_BATCH_SIZE = 100;

/**
 * Internal keys (r2Key/storageId) stay in the shared validator because
 * publishing reads them from full docs — use publicMediaAssetValidator plus
 * toPublicMediaAsset for client-facing return shapes instead.
 */
export const mediaAssetOutputValidator = v.object({
  ...schema.tables.mediaAssets.validator.fields,
  _id: v.id("mediaAssets"),
  _creationTime: v.number(),
});

/**
 * Client-facing media shape — storage internals (r2Key/storageId) are never
 * exposed. Mirrors mediaAssets minus those fields; keep in sync with schema.
 */
export const publicMediaAssetValidator = v.object({
  teamId: v.string(),
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
  _id: v.id("mediaAssets"),
  _creationTime: v.number(),
});

type MediaAssetDoc = DataModel["mediaAssets"]["document"];

export function toPublicMediaAsset(doc: MediaAssetDoc) {
  const publicAsset = { ...doc };
  delete publicAsset.r2Key;
  delete publicAsset.storageId;
  return publicAsset as Omit<MediaAssetDoc, "r2Key" | "storageId">;
}

async function requireOwnedMediaKey(ctx: QueryCtx | MutationCtx, key: string) {
  const user = await requireUser(ctx);
  const asset = await ctx.db
    .query("mediaAssets")
    .withIndex("by_r2_key", (q) => q.eq("r2Key", key))
    .first();
  if (!asset || asset.teamId !== user.selectedTeamId) {
    fail("NOT_FOUND", "Media not found");
  }
}

export const { generateUploadUrl, syncMetadata } = r2.clientApi<DataModel>({
  checkUpload: async (ctx) => {
    await requireUser(ctx);
  },
  // Guard the read/delete endpoints in case they are ever exported.
  checkReadKey: async (ctx, _bucket, key) => {
    await requireOwnedMediaKey(ctx, key);
  },
  checkReadBucket: async () => {
    fail("FORBIDDEN", "Bucket listing is not allowed");
  },
  checkDelete: async (ctx, _bucket, key) => {
    await requireOwnedMediaKey(ctx, key);
  },
  onUpload: async (ctx, _bucket, key) => {
    // Stamp team ownership as soon as the client registers the upload so
    // confirmMediaUpload cannot claim another team's object key. The scope
    // serializes concurrent syncMetadata calls for the same key (by_r2_key
    // is not unique).
    const user = await requireUser(ctx);
    await serializeScope(ctx, `media:r2:${key}`);
    const existing = await ctx.db
      .query("mediaAssets")
      .withIndex("by_r2_key", (q) => q.eq("r2Key", key))
      .unique();
    if (existing) {
      if (existing.teamId !== user.selectedTeamId) {
        fail("CONFLICT", "Upload key already registered");
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
      fail("INVALID_INPUT", "Filename is required");
    }
    if (
      !Number.isFinite(args.sizeBytes) ||
      args.sizeBytes < 0 ||
      args.sizeBytes > MAX_UPLOAD_BYTES
    ) {
      fail("INVALID_INPUT", "Invalid file size");
    }
    if (args.mimeType.length > 255 || !args.mimeType.includes("/")) {
      fail("INVALID_INPUT", "Invalid MIME type");
    }
    for (const value of [args.width, args.height, args.durationMs]) {
      if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
        fail("INVALID_INPUT", "Invalid media metadata");
      }
    }

    // Ensure the object exists in our R2 component metadata.
    const meta = await r2.getMetadata(ctx, args.r2Key);
    if (!meta) {
      return null;
    }

    // Size is only trustworthy from R2 metadata (HeadObject always returns
    // Content-Length). A missing size means metadata has not synced yet — let
    // the client retry rather than trusting a client-supplied sizeBytes.
    if (meta.size == null) {
      return null;
    }
    if (meta.size > MAX_UPLOAD_BYTES) {
      fail("INVALID_INPUT", "File exceeds maximum size");
    }

    const owned = await ctx.db
      .query("mediaAssets")
      .withIndex("by_r2_key", (q) => q.eq("r2Key", args.r2Key))
      .unique();

    if (!owned) {
      // onUpload has not stamped ownership yet; let the client retry.
      return null;
    }

    if (
      owned.teamId !== user.selectedTeamId ||
      owned.createdByUserId !== user.id
    ) {
      fail("NOT_FOUND", "Upload not found");
    }

    // Prefer server-side URL from R2; never trust an arbitrary client URL.
    const publicUrl = meta.url || meta.link || undefined;
    const sizeBytes = meta.size;
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
      fail("NOT_FOUND", "Media not found");
    }
    if (!asset.r2Key) {
      fail("NOT_FOUND", "Media storage key not found");
    }

    const postMediaAsset = await ctx.db
      .query("postMediaAssets")
      .withIndex("by_media_asset", (q) =>
        q.eq("mediaAssetId", args.mediaAssetId),
      )
      .first();
    if (postMediaAsset) {
      fail(
        "CONFLICT",
        "Remove this media from its saved post before deleting it",
      );
    }

    await r2.deleteObject(ctx, asset.r2Key);
    await ctx.db.delete("mediaAssets", asset._id);
    return null;
  },
});

/**
 * Remove mediaAssets left in `uploading` past the TTL — i.e. the client never
 * finished confirmMediaUpload — along with their R2 objects.
 * Intended to be scheduled from crons.ts (hourly is plenty).
 */
export const purgeStaleUploads = internalMutation({
  args: {},
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx) => {
    const staleBefore = Date.now() - STALE_UPLOAD_TTL_MS;
    const stale = await ctx.db
      .query("mediaAssets")
      .withIndex("by_status_created", (q) =>
        q.eq("status", "uploading").lt("createdAt", staleBefore),
      )
      .take(PURGE_BATCH_SIZE);

    await Promise.all(
      stale.map(async (asset) => {
        if (asset.r2Key) {
          await r2.deleteObject(ctx, asset.r2Key);
        }
        await ctx.db.delete("mediaAssets", asset._id);
      }),
    );

    return { deleted: stale.length };
  },
});
