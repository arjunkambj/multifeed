import { facebookConnector } from "./meta/facebook";
import { instagramConnector } from "./meta/instagram";
import { threadsConnector } from "./meta/threads";
import { linkedinConnector } from "./linkedin";
import { pinterestConnector } from "./pinterest";
import { redditConnector } from "./reddit";
import { snapchatConnector } from "./snapchat";
import {
  isOAuthPlatform,
  type OAuthPlatform,
  type SocialConnector,
} from "./types";
import { xConnector } from "./x";
import { tiktokConnector } from "./tiktok";
import { youtubeConnector } from "./youtube";

const REGISTRY: Record<OAuthPlatform, SocialConnector> = {
  facebook: facebookConnector,
  instagram: instagramConnector,
  threads: threadsConnector,
  linkedin: linkedinConnector,
  reddit: redditConnector,
  youtube: youtubeConnector,
  pinterest: pinterestConnector,
  x: xConnector,
  tiktok: tiktokConnector,
  snapchat: snapchatConnector,
};

export function getConnector(platform: string): SocialConnector {
  if (!isOAuthPlatform(platform)) {
    throw new Error(`Unsupported OAuth platform: ${platform}`);
  }
  return REGISTRY[platform];
}

export { isOAuthPlatform, type OAuthPlatform, type SocialConnector };
