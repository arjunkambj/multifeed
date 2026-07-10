import { requireEnv } from "../env";
import { oauthFetch } from "./http";
import type { SocialConnector } from "./types";

const SCOPES = [
  "openid",
  "profile",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

function credentials() {
  return {
    clientId: requireEnv("GOOGLE_CLIENT_ID"),
    clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
  };
}

export const youtubeConnector: SocialConnector = {
  platform: "youtube",
  capabilities: ["video", "image", "text", "analytics"],
  requiresPkce: false,

  buildAuthorizeUrl(input) {
    const { clientId } = credentials();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: input.redirectUri,
      response_type: "code",
      scope: SCOPES.join(" "),
      state: input.state,
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },

  async exchangeCode(input) {
    const { clientId, clientSecret } = credentials();
    const body = new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
    });
    const res = await oauthFetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      refresh_token_expires_in?: number;
      scope?: string;
      error_description?: string;
    };
    if (!res.ok || !data.access_token) {
      throw new Error(data.error_description ?? "Google token exchange failed");
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
      scopes: data.scope?.split(" ").filter(Boolean) ?? SCOPES,
      tokenType: "user" as const,
    };
  },

  async refreshAccessToken(refreshToken) {
    const { clientId, clientSecret } = credentials();
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });
    const res = await oauthFetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      scope?: string;
      error_description?: string;
    };
    if (!res.ok || !data.access_token) {
      throw new Error(data.error_description ?? "Google refresh failed");
    }
    return {
      accessToken: data.access_token,
      refreshToken,
      expiresAt: data.expires_in
        ? Date.now() + data.expires_in * 1000
        : undefined,
      scopes: data.scope?.split(" ").filter(Boolean) ?? SCOPES,
      tokenType: "user",
    };
  },

  async fetchProfile(accessToken) {
    const res = await oauthFetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const data = (await res.json()) as {
      items?: Array<{
        id: string;
        snippet?: {
          title?: string;
          customUrl?: string;
          thumbnails?: { default?: { url?: string } };
        };
      }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      throw new Error(data.error?.message ?? "YouTube channel fetch failed");
    }
    const channel = data.items?.[0];
    if (!channel) {
      throw new Error("No YouTube channel found for this Google account");
    }
    const custom = channel.snippet?.customUrl?.replace(/^@/, "");
    return {
      providerAccountId: channel.id,
      username: custom ?? channel.snippet?.title ?? channel.id,
      displayName: channel.snippet?.title,
      avatarUrl: channel.snippet?.thumbnails?.default?.url,
      tokenType: "user",
      metadata: { channelId: channel.id },
    };
  },
};
