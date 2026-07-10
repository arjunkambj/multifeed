export type PlatformKey =
  | "x"
  | "instagram"
  | "facebook"
  | "threads"
  | "linkedin"
  | "youtube"
  | "pinterest"
  | "reddit"
  | "tiktok"
  | "bluesky"
  | "google_business";

export type OAuthPlatform =
  | "x"
  | "instagram"
  | "facebook"
  | "threads"
  | "linkedin"
  | "youtube"
  | "pinterest"
  | "reddit";

export type PlatformMeta = {
  label: string;
  icon: string;
  brand: string;
  description?: string;
  maxChars?: number;
};

export const PLATFORM_META: Record<string, PlatformMeta> = {
  facebook: {
    label: "Facebook",
    icon: "hugeicons:facebook-02",
    brand: "#1877F2",
    description: "Pages for posts, photos, and video",
    maxChars: 63206,
  },
  instagram: {
    label: "Instagram",
    icon: "hugeicons:instagram",
    brand: "#E4405F",
    description: "Professional accounts via Meta",
    maxChars: 2200,
  },
  threads: {
    label: "Threads",
    icon: "hugeicons:threads",
    brand: "#111111",
    description: "Text and media on Threads",
    maxChars: 500,
  },
  linkedin: {
    label: "LinkedIn",
    icon: "hugeicons:linkedin-02",
    brand: "#0A66C2",
    description: "Personal profile posting",
    maxChars: 3000,
  },
  youtube: {
    label: "YouTube",
    icon: "hugeicons:youtube",
    brand: "#FF0000",
    description: "Channel uploads and metadata",
    maxChars: 5000,
  },
  pinterest: {
    label: "Pinterest",
    icon: "mdi:pinterest",
    brand: "#E60023",
    description: "Pins and boards",
    maxChars: 500,
  },
  reddit: {
    label: "Reddit",
    icon: "hugeicons:reddit",
    brand: "#FF4500",
    description: "Submit posts to communities",
    maxChars: 40000,
  },
  x: {
    label: "X",
    icon: "hugeicons:new-twitter",
    brand: "#111111",
    description: "Posts and media on X",
    maxChars: 280,
  },
  tiktok: { label: "TikTok", icon: "hugeicons:tiktok", brand: "#010101" },
  bluesky: { label: "Bluesky", icon: "simple-icons:bluesky", brand: "#1185FE" },
  google_business: {
    label: "Google Business",
    icon: "hugeicons:google",
    brand: "#4285F4",
  },
};

export const CONNECTABLE_PLATFORMS = [
  "facebook",
  "instagram",
  "threads",
  "linkedin",
  "youtube",
  "pinterest",
  "reddit",
  "x",
] as const satisfies readonly OAuthPlatform[];

export function platformLabel(platform: string) {
  return PLATFORM_META[platform]?.label ?? platform;
}

export function platformBrand(platform: string) {
  return PLATFORM_META[platform]?.brand ?? "#E85D04";
}
