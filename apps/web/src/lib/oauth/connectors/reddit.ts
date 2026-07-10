import { requireEnv } from "../env";
import { oauthFetch } from "./http";
import type { SocialConnector } from "./types";

const SCOPES = ["identity", "submit", "read"];

function credentials() {
  return {
    clientId: requireEnv("REDDIT_CLIENT_ID"),
    clientSecret: requireEnv("REDDIT_CLIENT_SECRET"),
    userAgent: requireEnv("REDDIT_USER_AGENT"),
  };
}

function basicAuth(): string {
  const { clientId, clientSecret } = credentials();
  return `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
}

export const redditConnector: SocialConnector = {
  platform: "reddit",
  capabilities: ["text", "image", "video", "analytics"],
  requiresPkce: false,

  buildAuthorizeUrl(input) {
    const { clientId } = credentials();
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      state: input.state,
      redirect_uri: input.redirectUri,
      duration: "permanent",
      scope: SCOPES.join(" "),
    });
    return `https://www.reddit.com/api/v1/authorize?${params}`;
  },

  async exchangeCode(input) {
    const { userAgent } = credentials();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
    });
    const res = await oauthFetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: basicAuth(),
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": userAgent,
      },
      body,
    });
    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      error?: string;
    };
    if (!res.ok || !data.access_token) {
      throw new Error(data.error ?? "Reddit token exchange failed");
    }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? Date.now() + data.expires_in * 1000
        : undefined,
      scopes: data.scope?.split(" ").filter(Boolean) ?? SCOPES,
      tokenType: "user" as const,
    };
  },

  async refreshAccessToken(refreshToken) {
    const { userAgent } = credentials();
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
    const res = await oauthFetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: basicAuth(),
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": userAgent,
      },
      body,
    });
    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      error?: string;
    };
    if (!res.ok || !data.access_token) {
      throw new Error(data.error ?? "Reddit refresh failed");
    }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: data.expires_in
        ? Date.now() + data.expires_in * 1000
        : undefined,
      scopes: data.scope?.split(" ").filter(Boolean) ?? SCOPES,
      tokenType: "user",
    };
  },

  async fetchProfile(accessToken) {
    const { userAgent } = credentials();
    const res = await oauthFetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": userAgent,
      },
    });
    const data = (await res.json()) as {
      id?: string;
      name?: string;
      icon_img?: string;
      message?: string;
    };
    if (!res.ok || !data.id || !data.name) {
      throw new Error(data.message ?? "Reddit profile fetch failed");
    }
    return {
      providerAccountId: data.id,
      username: data.name,
      displayName: data.name,
      avatarUrl: data.icon_img?.replace(/&amp;/g, "&"),
      tokenType: "user",
    };
  },
};
