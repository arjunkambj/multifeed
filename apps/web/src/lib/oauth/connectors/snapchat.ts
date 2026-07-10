import { requireEnv } from "../env";
import { oauthFetch } from "./http";
import type { SocialConnector, TokenBundle } from "./types";

const SCOPES = ["snapchat-profile-api"];
const TOKEN_URL = "https://accounts.snapchat.com/login/oauth2/access_token";

const credentials = () => ({
  clientId: requireEnv("SNAPCHAT_CLIENT_ID"),
  clientSecret: requireEnv("SNAPCHAT_CLIENT_SECRET"),
});

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

const tokenBundle = (data: TokenResponse, fallbackRefreshToken?: string) => ({
  accessToken: data.access_token!,
  refreshToken: data.refresh_token ?? fallbackRefreshToken,
  expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
  scopes: data.scope?.split(/[,\s]+/).filter(Boolean) ?? SCOPES,
  tokenType: "page" as const,
});

export const snapchatConnector: SocialConnector = {
  platform: "snapchat",
  capabilities: ["image", "video", "analytics"],
  requiresPkce: false,

  buildAuthorizeUrl(input) {
    const { clientId } = credentials();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: input.redirectUri,
      response_type: "code",
      scope: SCOPES.join(" "),
      state: input.state,
    });
    return `https://accounts.snapchat.com/login/oauth2/authorize?${params}`;
  },

  async exchangeCode(input) {
    const { clientId, clientSecret } = credentials();
    const res = await oauthFetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code: input.code,
        redirect_uri: input.redirectUri,
      }),
    });
    const data = (await res.json()) as TokenResponse;
    if (!res.ok || !data.access_token) {
      throw new Error(
        data.error_description ??
          data.error ??
          "Snapchat token exchange failed",
      );
    }
    return tokenBundle(data) satisfies TokenBundle;
  },

  async refreshAccessToken(refreshToken) {
    const { clientId, clientSecret } = credentials();
    const res = await oauthFetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });
    const data = (await res.json()) as TokenResponse;
    if (!res.ok || !data.access_token) {
      throw new Error(
        data.error_description ?? data.error ?? "Snapchat refresh failed",
      );
    }
    return tokenBundle(data, refreshToken) satisfies TokenBundle;
  },

  async fetchProfile(accessToken) {
    const res = await oauthFetch(
      "https://businessapi.snapchat.com/v1/public_profiles/my_profile",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const data = (await res.json()) as {
      request_status?: string;
      display_message?: string;
      public_profile?: {
        id?: string;
        organization_id?: string;
        display_name?: string;
        snap_user_name?: string;
        profile_type?: string;
        profile_tier?: string;
        logo_urls?: {
          original_logo_url?: string;
          manage_profile_logo_url?: string;
        };
      };
    };
    const profile = data.public_profile;
    if (!res.ok || data.request_status !== "SUCCESS" || !profile?.id) {
      throw new Error(data.display_message ?? "Snapchat profile fetch failed");
    }
    return {
      providerAccountId: profile.id,
      username: profile.snap_user_name ?? profile.id,
      displayName: profile.display_name,
      avatarUrl:
        profile.logo_urls?.original_logo_url ??
        profile.logo_urls?.manage_profile_logo_url,
      tokenType: "page" as const,
      metadata: {
        ...(profile.organization_id && {
          organizationId: profile.organization_id,
        }),
        ...(profile.profile_type && { profileType: profile.profile_type }),
        ...(profile.profile_tier && { profileTier: profile.profile_tier }),
      },
    };
  },
};
