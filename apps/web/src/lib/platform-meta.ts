import { OAUTH_PLATFORMS } from "@/lib/oauth/connectors/types";

export type PlatformKey =
  | "x"
  | "instagram"
  | "facebook"
  | "threads"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "bluesky"
  | "google_business";

export type { OAuthPlatform } from "@/lib/oauth/connectors/types";

export type PlatformMeta = {
  label: string;
  icon: string;
  brand: string;
  foreground?: string;
  description?: string;
  maxChars?: number;
};

export const PLATFORM_META: Record<string, PlatformMeta> = {
  facebook: {
    label: "Facebook",
    // Single-glyph brand mark reads cleaner in small badges than the wordmark.
    icon: "fa6-brands:facebook-f",
    brand: "#1877F2",
    description: "Pages for posts, photos, and video",
    maxChars: 63206,
  },
  instagram: {
    label: "Instagram",
    icon: "fa6-brands:instagram",
    brand: "#E4405F",
    description: "Professional accounts via Meta",
    maxChars: 2200,
  },
  threads: {
    label: "Threads",
    icon: "fa6-brands:threads",
    brand: "#111111",
    description: "Text and media on Threads",
    maxChars: 500,
  },
  linkedin: {
    label: "LinkedIn",
    icon: "fa6-brands:linkedin-in",
    brand: "#0A66C2",
    description: "Personal profile posting",
    maxChars: 3000,
  },
  youtube: {
    label: "YouTube",
    icon: "fa6-brands:youtube",
    brand: "#FF0000",
    description: "Channel uploads and metadata",
    maxChars: 5000,
  },
  x: {
    label: "X",
    icon: "fa6-brands:x-twitter",
    brand: "#111111",
    description: "Posts and media on X",
    maxChars: 280,
  },
  tiktok: {
    label: "TikTok",
    icon: "fa6-brands:tiktok",
    brand: "#010101",
    description: "Videos and photos via Content Posting API",
    maxChars: 2200,
  },
  bluesky: {
    label: "Bluesky",
    icon: "fa6-brands:bluesky",
    brand: "#1185FE",
  },
  google_business: {
    label: "Google Business",
    icon: "fa6-brands:google",
    brand: "#4285F4",
  },
};

export const CONNECTABLE_PLATFORMS = OAUTH_PLATFORMS;

export function platformLabel(platform: string) {
  return PLATFORM_META[platform]?.label ?? platform;
}

export function platformBrand(platform: string) {
  return PLATFORM_META[platform]?.brand ?? "#E85D04";
}
