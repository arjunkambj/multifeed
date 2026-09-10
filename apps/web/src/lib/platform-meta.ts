import {
  OAUTH_PLATFORMS,
  type OAuthPlatform,
} from "@/lib/oauth/connectors/types";

export type { OAuthPlatform } from "@/lib/oauth/connectors/types";

export type PlatformMeta = {
  label: string;
  icon: string;
  brand: string;
  ink?: string;
  foreground?: string;
  description?: string;
  maxChars?: number;
};

export const PLATFORM_META: Record<OAuthPlatform, PlatformMeta> &
  Partial<Record<string, PlatformMeta>> = {
  facebook: {
    label: "Facebook",
    // Single-glyph brand mark reads cleaner in small badges than the wordmark.
    icon: "fa6-brands:facebook-f",
    brand: "var(--platform-facebook)",
    description: "Pages for posts, photos, and video",
    maxChars: 63206,
  },
  instagram: {
    label: "Instagram",
    icon: "fa6-brands:instagram",
    brand: "var(--platform-instagram)",
    description: "Professional accounts via Meta",
    maxChars: 2200,
  },
  threads: {
    label: "Threads",
    icon: "fa6-brands:threads",
    brand: "var(--platform-threads)",
    ink: "var(--platform-threads-ink)",
    foreground: "var(--platform-threads-fg)",
    description: "Text and media on Threads",
    maxChars: 500,
  },
  linkedin: {
    label: "LinkedIn",
    icon: "fa6-brands:linkedin-in",
    brand: "var(--platform-linkedin)",
    description: "Personal profile posting",
    maxChars: 3000,
  },
  youtube: {
    label: "YouTube",
    icon: "fa6-brands:youtube",
    brand: "var(--platform-youtube)",
    description: "Videos and Shorts on your channel",
    maxChars: 5000,
  },
  x: {
    label: "X",
    icon: "fa6-brands:x-twitter",
    brand: "var(--platform-x)",
    ink: "var(--platform-x-ink)",
    foreground: "var(--platform-x-fg)",
    description: "Posts and media on X",
    maxChars: 280,
  },
  tiktok: {
    label: "TikTok",
    icon: "fa6-brands:tiktok",
    brand: "var(--platform-tiktok)",
    ink: "var(--platform-tiktok-ink)",
    foreground: "var(--platform-tiktok-fg)",
    description: "Videos and photos on TikTok",
    maxChars: 2200,
  },
};

export const CONNECTABLE_PLATFORMS = OAUTH_PLATFORMS;

export function platformLabel(platform: string) {
  return PLATFORM_META[platform]?.label ?? platform;
}

export function platformBrand(platform: string) {
  return PLATFORM_META[platform]?.brand ?? "#18181b";
}

export function platformInk(platform: string) {
  return PLATFORM_META[platform]?.ink ?? platformBrand(platform);
}

export function platformForeground(platform: string) {
  return PLATFORM_META[platform]?.foreground ?? "#fff";
}
