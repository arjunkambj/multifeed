import type { Doc } from "./_generated/dataModel";

export const MAX_TARGETS_PER_POST = 100;
export const MAX_MEDIA_ASSETS_PER_POST = 10;

export const POST_KIND_PLATFORMS = {
  text: ["facebook", "linkedin", "threads", "x"],
  image: ["facebook", "instagram", "linkedin", "threads", "x", "tiktok"],
  video: [
    "facebook",
    "instagram",
    "threads",
    "tiktok",
    "youtube",
    "linkedin",
    "x",
  ],
  story: ["facebook", "instagram"],
} as const satisfies Record<
  Doc<"posts">["kind"],
  readonly Doc<"connectedAccounts">["platform"][]
>;
