import type { SocialConnector } from "../types";
import {
  threadsAuthorizeUrl,
  threadsExchangeCodeNative,
  threadsFetchProfile,
  threadsRefreshAccessToken,
} from "./shared";

const SCOPES = [
  "threads_basic",
  "threads_content_publish",
  "threads_manage_insights",
];

export const threadsConnector: SocialConnector = {
  platform: "threads",
  capabilities: ["text", "image", "video", "carousel", "analytics"],
  requiresPkce: false,

  buildAuthorizeUrl(input) {
    return threadsAuthorizeUrl({ ...input, scopes: SCOPES });
  },

  async exchangeCode(input) {
    const tokens = await threadsExchangeCodeNative(input);
    return { ...tokens, scopes: SCOPES };
  },

  async refreshAccessToken(refreshToken) {
    const tokens = await threadsRefreshAccessToken(refreshToken);
    return { ...tokens, scopes: SCOPES };
  },

  async fetchProfile(accessToken) {
    return threadsFetchProfile(accessToken);
  },
};
