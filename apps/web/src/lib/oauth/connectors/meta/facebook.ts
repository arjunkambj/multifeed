import type { AccountProfile, SocialConnector, TokenBundle } from "../types";
import {
  metaAuthorizeUrl,
  metaExchangeCode,
  metaFetchMe,
  metaListPages,
  pagesToFacebookOptions,
} from "./shared";

const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "pages_read_user_content",
  "read_insights",
  "pages_messaging",
  "pages_manage_metadata",
];

export const facebookConnector: SocialConnector = {
  platform: "facebook",
  capabilities: ["text", "image", "video", "carousel", "analytics", "inbox"],
  requiresPkce: false,

  buildAuthorizeUrl(input) {
    return metaAuthorizeUrl({ ...input, scopes: SCOPES });
  },

  async exchangeCode(input) {
    const tokens = await metaExchangeCode(input);
    const missing = SCOPES.filter((scope) => !tokens.scopes.includes(scope));
    if (missing.length) {
      throw new Error(`Missing Facebook permissions: ${missing.join(", ")}`);
    }
    return tokens;
  },

  async fetchProfile(accessToken) {
    return metaFetchMe(accessToken);
  },

  async listSelectableAccounts(accessToken) {
    const pages = await metaListPages(accessToken);
    return pagesToFacebookOptions(pages);
  },

  async resolveSelectedAccount(accessToken, optionId, option) {
    const pages = await metaListPages(accessToken);
    const page = pages.find((p) => p.id === optionId);
    if (!page?.access_token) {
      throw new Error("Facebook Page access token not available");
    }

    const tokens: TokenBundle = {
      accessToken: page.access_token,
      scopes: SCOPES,
      tokenType: "page",
    };

    const profile: AccountProfile = {
      providerAccountId: page.id,
      username: page.username ?? page.name,
      displayName: page.name,
      avatarUrl: page.picture?.data?.url ?? option?.avatarUrl,
      tokenType: "page",
      metadata: { pageId: page.id, pageName: page.name },
    };

    return { tokens, profile };
  },
};
