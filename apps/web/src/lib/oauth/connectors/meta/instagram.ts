import { requireEnv } from "../../env";
import type { AccountProfile, SocialConnector, TokenBundle } from "../types";
import {
  metaAuthorizeUrl,
  metaExchangeCode,
  metaFetchIgProfile,
  metaListPages,
  pagesToInstagramOptions,
} from "./shared";

const SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_insights",
  "instagram_manage_comments",
  "instagram_manage_messages",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
];

export const instagramConnector: SocialConnector = {
  platform: "instagram",
  capabilities: ["text", "image", "video", "carousel", "analytics", "inbox"],
  requiresPkce: false,

  buildAuthorizeUrl(input) {
    return metaAuthorizeUrl({
      ...input,
      configurationId: requireEnv("META_INSTAGRAM_CONFIG_ID"),
    });
  },

  async exchangeCode(input) {
    const tokens = await metaExchangeCode(input);
    const missing = SCOPES.filter((scope) => !tokens.scopes.includes(scope));
    if (missing.length) {
      throw new Error(`Missing Instagram permissions: ${missing.join(", ")}`);
    }
    return tokens;
  },

  async listAccounts(accessToken) {
    const pages = await metaListPages(accessToken);
    return pagesToInstagramOptions(pages);
  },

  async resolveAccount(userTokens, option) {
    const pageAccessToken = option.metadata?.pageAccessToken;
    const pageId = option.metadata?.pageId;
    const igUserId = option.metadata?.igUserId;
    if (
      typeof pageAccessToken !== "string" ||
      typeof pageId !== "string" ||
      igUserId !== option.id
    ) {
      throw new Error("Instagram account not found");
    }

    const profile = await metaFetchIgProfile(pageAccessToken, igUserId);
    const tokens: TokenBundle = {
      accessToken: pageAccessToken,
      refreshToken: userTokens.accessToken,
      expiresAt: userTokens.expiresAt,
      refreshTokenExpiresAt: userTokens.expiresAt,
      scopes: SCOPES,
      tokenType: "page",
    };
    const fullProfile: AccountProfile = {
      ...profile,
      metadata: {
        ...profile.metadata,
        pageId,
        pageName: option.label,
        igUserId,
      },
    };
    return { tokens, profile: fullProfile };
  },
};
