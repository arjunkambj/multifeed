import type { Doc, Id } from "@convex/_generated/dataModel";
import { POST_KIND_PLATFORMS } from "@convex/postConfig";
import { Image, Smartphone, SquarePen, VideoCamera } from "@honeyicons/react";
export { POST_KIND_PLATFORMS } from "@convex/postConfig";

export type PostKind = Doc<"posts">["kind"];
export type PlatformSettings = NonNullable<
  Doc<"postTargets">["platformSettings"]
>;
export type PostPlacement = NonNullable<PlatformSettings["placement"]>;
export type PostVisibility = NonNullable<PlatformSettings["visibility"]>;

export type ComposerMedia = {
  _id: Id<"mediaAssets">;
  filename: string;
  mimeType: string;
  kind: "image" | "video" | "document";
  sizeBytes: number;
  publicUrl?: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  durationMs?: number;
};

export const POST_FORMATS = [
  {
    id: "text",
    label: "Text post",
    description: "Caption or link update",
    icon: SquarePen,
  },
  {
    id: "image",
    label: "Image post",
    description: "Single image or carousel",
    icon: Image,
  },
  {
    id: "video",
    label: "Video / reel",
    description: "Feed video, Reel, or Short",
    icon: VideoCamera,
  },
  {
    id: "story",
    label: "Story post",
    description: "Vertical image or video",
    icon: Smartphone,
  },
] as const;

export const formatLabel = (kind: PostKind) =>
  POST_FORMATS.find((format) => format.id === kind)?.label ?? "Post";

export const acceptedMedia = (kind: PostKind) => {
  if (kind === "image") return "image/*";
  if (kind === "video") return "video/*";
  if (kind === "story") return "image/*,video/*";
  return undefined;
};

export const maxMediaCount = (kind: PostKind) => (kind === "image" ? 10 : 1);

export const accountSupportsPostKind = (
  account: { platform: string; capabilities: string[] },
  kind: PostKind,
  storyMediaKind?: "image" | "video",
  mediaCount?: number,
) => {
  if (
    !POST_KIND_PLATFORMS[kind].some((platform) => platform === account.platform)
  ) {
    return false;
  }

  if (kind === "story") {
    return (
      storyMediaKind == null || account.capabilities.includes(storyMediaKind)
    );
  }
  // Multi-image posts are published as carousels, which some accounts don't
  // support even though they accept a single image.
  if (kind === "image" && (mediaCount ?? 1) > 1) {
    return account.capabilities.includes("carousel");
  }
  return account.capabilities.includes(kind);
};

export const defaultPlatformSettings = (
  platform: string,
  kind: PostKind,
): PlatformSettings => {
  if (kind === "story") return { placement: "story", allowComments: true };
  if (kind === "image") {
    return { placement: "feed", allowComments: true };
  }
  if (kind === "video") {
    const placement: PostPlacement =
      platform === "instagram" || platform === "facebook"
        ? "reel"
        : platform === "youtube"
          ? "short"
          : "feed";
    return {
      placement,
      visibility: "public",
      shareToFeed: placement === "reel",
      allowComments: true,
      allowDuet: platform === "tiktok",
      allowStitch: platform === "tiktok",
      notifySubscribers: platform === "youtube",
      madeForKids: false,
    };
  }
  return { placement: "feed", allowComments: true };
};

export const placementOptions = (platform: string, kind: PostKind) => {
  if (kind === "story") return [{ id: "story", label: "Story" }] as const;
  if (kind === "image") {
    return [{ id: "feed", label: "Feed" }] as const;
  }
  if (kind !== "video") return [{ id: "feed", label: "Feed" }] as const;
  if (["instagram", "facebook"].includes(platform)) {
    return [
      { id: "reel", label: "Reel" },
      { id: "feed", label: "Feed video" },
    ] as const;
  }
  if (platform === "youtube") {
    return [
      { id: "short", label: "Short" },
      { id: "feed", label: "Video" },
    ] as const;
  }
  return [{ id: "feed", label: "Feed video" }] as const;
};
