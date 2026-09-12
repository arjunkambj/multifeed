import {
  Facebook,
  Instagram,
  Integration,
  Linkedin,
  Threads,
  Tiktok,
  X,
  Youtube,
  type HoneyIcon,
} from "@honeyicons/react";
import {
  OAUTH_PLATFORMS,
  type OAuthPlatform,
} from "@/lib/oauth/connectors/types";

export type { OAuthPlatform } from "@/lib/oauth/connectors/types";

export type PlatformMeta = {
  label: string;
  icon: HoneyIcon;
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
    icon: Facebook,
    brand: "var(--platform-facebook)",
    description: "Pages for posts, photos, and video",
    maxChars: 63206,
  },
  instagram: {
    label: "Instagram",
    icon: Instagram,
    brand: "var(--platform-instagram)",
    description: "Professional accounts via Meta",
    maxChars: 2200,
  },
  threads: {
    label: "Threads",
    icon: Threads,
    brand: "var(--platform-threads)",
    ink: "var(--platform-threads-ink)",
    foreground: "var(--platform-threads-fg)",
    description: "Text and media on Threads",
    maxChars: 500,
  },
  linkedin: {
    label: "LinkedIn",
    icon: Linkedin,
    brand: "var(--platform-linkedin)",
    description: "Personal profile posting",
    maxChars: 3000,
  },
  youtube: {
    label: "YouTube",
    icon: Youtube,
    brand: "var(--platform-youtube)",
    description: "Videos and Shorts on your channel",
    maxChars: 5000,
  },
  x: {
    label: "X",
    icon: X,
    brand: "var(--platform-x)",
    ink: "var(--platform-x-ink)",
    foreground: "var(--platform-x-fg)",
    description: "Posts and media on X",
    maxChars: 280,
  },
  tiktok: {
    label: "TikTok",
    icon: Tiktok,
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

export function platformIcon(platform: string): HoneyIcon {
  return PLATFORM_META[platform]?.icon ?? Integration;
}
