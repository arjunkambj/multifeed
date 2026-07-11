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

  async fetchProfile(accessToken) {
    const pages = await metaListPages(accessToken);
    const withIg = pages.find((p) => p.instagram_business_account?.id);
    if (!withIg?.instagram_business_account || !withIg.access_token) {
      throw new Error(
        "No Instagram professional account linked to your Facebook Pages",
      );
    }
    return metaFetchIgProfile(
      withIg.access_token,
      withIg.instagram_business_account.id,
    );
  },

  async listAccounts(accessToken) {
    const pages = await metaListPages(accessToken);
    return pagesToInstagramOptions(pages);
  },

  async resolveAccount(userTokens, optionId, option) {
    const pageAccessToken = option?.metadata?.pageAccessToken;
    const pageId = option?.metadata?.pageId;
    const igUserId = option?.metadata?.igUserId;
    if (
      option?.id !== optionId ||
      typeof pageAccessToken !== "string" ||
      typeof pageId !== "string" ||
      igUserId !== optionId
    ) {
      throw new Error("Instagram account not found");
    }

    const profile = await metaFetchIgProfile(pageAccessToken, igUserId);
    const tokens: TokenBundle = {
      accessToken: pageAccessToken,
      expiresAt: userTokens.expiresAt,
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
