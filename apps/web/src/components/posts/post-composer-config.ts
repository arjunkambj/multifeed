import type { Id } from "@convex/_generated/dataModel";

export type PostKind = "text" | "image" | "video" | "story";

export type PostPlacement =
  | "feed"
  | "reel"
  | "story"
  | "short"
  | "spotlight"
  | "pin";

export type PostVisibility = "public" | "followers" | "private" | "unlisted";

export type PlatformSettings = {
  placement?: PostPlacement;
  title?: string;
  altText?: string;
  destinationUrl?: string;
  boardId?: string;
  subreddit?: string;
  visibility?: PostVisibility;
  shareToFeed?: boolean;
  allowComments?: boolean;
  allowDuet?: boolean;
  allowStitch?: boolean;
  notifySubscribers?: boolean;
  madeForKids?: boolean;
};

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
    icon: "hugeicons:text-font",
  },
  {
    id: "image",
    label: "Image post",
    description: "Single image or carousel",
    icon: "hugeicons:image-02",
  },
  {
    id: "video",
    label: "Video / reel",
    description: "Feed video, Reel, or Short",
    icon: "hugeicons:video-01",
  },
  {
    id: "story",
    label: "Story post",
    description: "Vertical image or video",
    icon: "hugeicons:camera-01",
  },
] as const satisfies ReadonlyArray<{
  id: PostKind;
  label: string;
  description: string;
  icon: string;
}>;

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
) => {
  if (kind === "story") {
    return (
      ["facebook", "instagram", "snapchat"].includes(account.platform) &&
      (storyMediaKind == null || account.capabilities.includes(storyMediaKind))
    );
  }
  return account.capabilities.includes(kind);
};

export const defaultPlatformSettings = (
  platform: string,
  kind: PostKind,
): PlatformSettings => {
  if (kind === "story") return { placement: "story", allowComments: true };
  if (kind === "image") {
    return {
      placement: platform === "pinterest" ? "pin" : "feed",
      allowComments: true,
    };
  }
  if (kind === "video") {
    const placement: PostPlacement =
      platform === "instagram" || platform === "facebook"
        ? "reel"
        : platform === "youtube"
          ? "short"
          : platform === "snapchat"
            ? "spotlight"
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
    return platform === "pinterest"
      ? ([{ id: "pin", label: "Pin" }] as const)
      : ([{ id: "feed", label: "Feed" }] as const);
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
  if (platform === "snapchat") {
    return [
      { id: "spotlight", label: "Spotlight" },
      { id: "story", label: "Story" },
    ] as const;
  }
  return [{ id: "feed", label: "Feed video" }] as const;
};
