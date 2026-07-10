import { requireEnv } from "../env";
import { oauthFetch } from "./http";
import type { SocialConnector } from "./types";

const SCOPES = ["boards:read", "pins:read", "pins:write", "user_accounts:read"];

function credentials() {
  return {
    clientId: requireEnv("PINTEREST_CLIENT_ID"),
    clientSecret: requireEnv("PINTEREST_CLIENT_SECRET"),
  };
}

export const pinterestConnector: SocialConnector = {
  platform: "pinterest",
  capabilities: ["image", "video", "carousel", "analytics"],
  requiresPkce: false,

  buildAuthorizeUrl(input) {
    const { clientId } = credentials();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: input.redirectUri,
      response_type: "code",
      scope: SCOPES.join(","),
      state: input.state,
    });
    return `https://www.pinterest.com/oauth/?${params}`;
  },

  async exchangeCode(input) {
    const { clientId, clientSecret } = credentials();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
      continuous_refresh: "true",
    });
    const basic = btoa(`${clientId}:${clientSecret}`);
    const res = await oauthFetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      refresh_token_expires_in?: number;
      scope?: string;
      message?: string;
    };
    if (!res.ok || !data.access_token) {
      throw new Error(data.message ?? "Pinterest token exchange failed");
    }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? Date.now() + data.expires_in * 1000
        : undefined,
      refreshTokenExpiresAt: data.refresh_token_expires_in
        ? Date.now() + data.refresh_token_expires_in * 1000
        : undefined,
      scopes: data.scope?.split(/[,\s]+/).filter(Boolean) ?? SCOPES,
      tokenType: "user" as const,
    };
  },

  async refreshAccessToken(refreshToken) {
    const { clientId, clientSecret } = credentials();
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      continuous_refresh: "true",
    });
    const basic = btoa(`${clientId}:${clientSecret}`);
    const res = await oauthFetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      refresh_token_expires_in?: number;
      scope?: string;
      message?: string;
    };
    if (!res.ok || !data.access_token) {
      throw new Error(data.message ?? "Pinterest refresh failed");
    }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: data.expires_in
        ? Date.now() + data.expires_in * 1000
        : undefined,
      refreshTokenExpiresAt: data.refresh_token_expires_in
        ? Date.now() + data.refresh_token_expires_in * 1000
        : undefined,
      scopes: data.scope?.split(/[,\s]+/).filter(Boolean) ?? SCOPES,
      tokenType: "user",
    };
  },

  async fetchProfile(accessToken) {
    const res = await oauthFetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as {
      username?: string;
      id?: string;
      profile_image?: string;
      business_name?: string;
      message?: string;
    };
    if (!res.ok || !data.username) {
      throw new Error(data.message ?? "Pinterest profile fetch failed");
    }
    return {
      providerAccountId: data.id ?? data.username,
      username: data.username,
      displayName: data.business_name ?? data.username,
      avatarUrl: data.profile_image,
      tokenType: "user",
    };
  },
};
