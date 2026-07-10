import { optionalEnv, requireEnv } from "../env";
import { oauthFetch } from "./http";
import type { SocialConnector } from "./types";

const SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];

function credentials() {
  return {
    clientId: requireEnv("X_CLIENT_ID"),
    clientSecret: optionalEnv("X_CLIENT_SECRET"),
  };
}

function authHeader(
  clientId: string,
  clientSecret?: string,
): Record<string, string> {
  if (clientSecret) {
    return {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    };
  }
  return {};
}

export const xConnector: SocialConnector = {
  platform: "x",
  capabilities: ["text", "image", "video", "analytics"],
  requiresPkce: true,

  buildAuthorizeUrl(input) {
    const { clientId } = credentials();
    if (!input.codeChallenge) {
      throw new Error("X OAuth requires PKCE code_challenge");
    }
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: input.redirectUri,
      scope: SCOPES.join(" "),
      state: input.state,
      code_challenge: input.codeChallenge,
      code_challenge_method: "S256",
    });
    return `https://x.com/i/oauth2/authorize?${params}`;
  },

  async exchangeCode(input) {
    const { clientId, clientSecret } = credentials();
    if (!input.codeVerifier) {
      throw new Error("X OAuth requires PKCE code_verifier");
    }
    const body = new URLSearchParams({
      code: input.code,
      grant_type: "authorization_code",
      redirect_uri: input.redirectUri,
      code_verifier: input.codeVerifier,
    });
    if (!clientSecret) body.set("client_id", clientId);
    const res = await oauthFetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...authHeader(clientId, clientSecret),
      },
      body,
    });
    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      error_description?: string;
      error?: string;
    };
    if (!res.ok || !data.access_token) {
      throw new Error(
        data.error_description ?? data.error ?? "X token exchange failed",
      );
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
    const { clientId, clientSecret } = credentials();
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });
    if (!clientSecret) body.set("client_id", clientId);
    const res = await oauthFetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...authHeader(clientId, clientSecret),
      },
      body,
    });
    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      error_description?: string;
      error?: string;
    };
    if (!res.ok || !data.access_token) {
      throw new Error(
        data.error_description ?? data.error ?? "X refresh failed",
      );
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
    const res = await oauthFetch(
      "https://api.x.com/2/users/me?user.fields=profile_image_url,name,username",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const data = (await res.json()) as {
      data?: {
        id: string;
        username: string;
        name?: string;
        profile_image_url?: string;
      };
      detail?: string;
      title?: string;
    };
    if (!res.ok || !data.data) {
      throw new Error(data.detail ?? data.title ?? "X profile fetch failed");
    }
    return {
      providerAccountId: data.data.id,
      username: data.data.username,
      displayName: data.data.name,
      avatarUrl: data.data.profile_image_url,
      tokenType: "user",
    };
  },
};
