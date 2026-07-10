import { requireEnv } from "../env";
import { oauthFetch } from "./http";
import type { SocialConnector, TokenBundle } from "./types";

const SCOPES = ["openid", "profile", "email", "w_member_social"];

function credentials() {
  return {
    clientId: requireEnv("LINKEDIN_CLIENT_ID"),
    clientSecret: requireEnv("LINKEDIN_CLIENT_SECRET"),
  };
}

export const linkedinConnector: SocialConnector = {
  platform: "linkedin",
  capabilities: ["text", "image", "video", "carousel", "analytics"],
  requiresPkce: false,

  buildAuthorizeUrl(input) {
    const { clientId } = credentials();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: input.redirectUri,
      state: input.state,
      scope: SCOPES.join(" "),
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  },

  async exchangeCode(input) {
    const { clientId, clientSecret } = credentials();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const res = await oauthFetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
      refresh_token_expires_in?: number;
      scope?: string;
      error_description?: string;
    };
    if (!res.ok || !data.access_token) {
      throw new Error(
        data.error_description ?? "LinkedIn token exchange failed",
      );
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
    } satisfies TokenBundle;
  },

  async refreshAccessToken(refreshToken) {
    const { clientId, clientSecret } = credentials();
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const res = await oauthFetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
      refresh_token_expires_in?: number;
      scope?: string;
      error_description?: string;
    };
    if (!res.ok || !data.access_token) {
      throw new Error(data.error_description ?? "LinkedIn refresh failed");
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
    const res = await oauthFetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as {
      sub?: string;
      name?: string;
      picture?: string;
      email?: string;
      message?: string;
    };
    if (!res.ok || !data.sub) {
      throw new Error(data.message ?? "LinkedIn profile fetch failed");
    }
    return {
      providerAccountId: data.sub,
      username: data.email?.split("@")[0] ?? data.sub,
      displayName: data.name,
      avatarUrl: data.picture,
      tokenType: "user",
      metadata: { email: data.email },
    };
  },
};
