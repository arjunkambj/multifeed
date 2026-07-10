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
    return metaAuthorizeUrl({ ...input, scopes: SCOPES });
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

  async listSelectableAccounts(accessToken) {
    const pages = await metaListPages(accessToken);
    return pagesToInstagramOptions(pages);
  },

  async resolveSelectedAccount(accessToken, optionId) {
    const pages = await metaListPages(accessToken);
    const page = pages.find(
      (p) => p.instagram_business_account?.id === optionId,
    );
    if (!page?.instagram_business_account || !page.access_token) {
      throw new Error("Instagram account not found");
    }

    const igId = page.instagram_business_account.id;
    const profile = await metaFetchIgProfile(page.access_token, igId);
    const tokens: TokenBundle = {
      accessToken: page.access_token,
      scopes: SCOPES,
      tokenType: "page",
    };
    const fullProfile: AccountProfile = {
      ...profile,
      metadata: {
        ...profile.metadata,
        pageId: page.id,
        pageName: page.name,
        igUserId: igId,
      },
    };
    return { tokens, profile: fullProfile };
  },
};
