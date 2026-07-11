import { facebookConnector } from "./meta/facebook";
import { instagramConnector } from "./meta/instagram";
import { threadsConnector } from "./meta/threads";
import { linkedinConnector } from "./linkedin";
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
  youtube: youtubeConnector,
  x: xConnector,
  tiktok: tiktokConnector,
};

export function getConnector(platform: string): SocialConnector {
  if (!isOAuthPlatform(platform)) {
    throw new Error(`Unsupported OAuth platform: ${platform}`);
  }
  return REGISTRY[platform];
}

export { isOAuthPlatform, type OAuthPlatform, type SocialConnector };
