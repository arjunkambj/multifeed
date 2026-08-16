"use node";

import type { Doc } from "../_generated/dataModel";

export type RefreshedToken = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  refreshTokenExpiresAt?: number;
};

async function fetchJson(url: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, json };
}

async function refreshMetaPageToken(
  platform: "facebook" | "instagram",
  userToken: string,
  providerAccountId: string,
): Promise<RefreshedToken | null> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Convex is missing META_APP_ID or META_APP_SECRET");

  const exchanged = await fetchJson(
    `https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(userToken)}`,
  );
  const nextUserToken =
    exchanged.ok && typeof exchanged.json.access_token === "string"
      ? exchanged.json.access_token
      : userToken;
  const expiresAt =
    exchanged.ok && typeof exchanged.json.expires_in === "number"
      ? Date.now() + exchanged.json.expires_in * 1000
      : undefined;

  const pages = await fetchJson(
    `https://graph.facebook.com/v24.0/me/accounts?fields=id,access_token,instagram_business_account&limit=100&access_token=${encodeURIComponent(nextUserToken)}`,
  );
  if (!pages.ok || !Array.isArray(pages.json.data)) return null;

  const page = (pages.json.data as Array<Record<string, unknown>>).find((entry) => {
    if (platform === "facebook") return entry.id === providerAccountId;
    const ig = entry.instagram_business_account as { id?: string } | undefined;
    return ig?.id === providerAccountId;
  });
  const pageToken = page && typeof page.access_token === "string" ? page.access_token : null;
  if (!pageToken) return null;

  return {
    accessToken: pageToken,
    refreshToken: nextUserToken,
    expiresAt,
    refreshTokenExpiresAt: expiresAt,
  };
}

export async function refreshAccessTokenForPlatform(
  account: Doc<"connectedAccounts">,
  refreshToken: string,
): Promise<RefreshedToken | null> {
  if (account.platform === "x") {
    const id = process.env.X_CLIENT_ID;
    const secret = process.env.X_CLIENT_SECRET;
    if (!id) throw new Error("Convex is missing X_CLIENT_ID");
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });
    if (!secret) body.set("client_id", id);
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    if (secret) headers.Authorization = `Basic ${btoa(`${id}:${secret}`)}`;
    const { ok, json } = await fetchJson("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers,
      body,
    });
    if (!ok || typeof json.access_token !== "string") return null;
    return {
      accessToken: json.access_token,
      refreshToken:
        typeof json.refresh_token === "string" ? json.refresh_token : refreshToken,
      expiresAt:
        typeof json.expires_in === "number"
          ? Date.now() + json.expires_in * 1000
          : undefined,
    };
  }

  if (account.platform === "linkedin") {
    const id = process.env.LINKEDIN_CLIENT_ID;
    const secret = process.env.LINKEDIN_CLIENT_SECRET;
    if (!id || !secret) throw new Error("Convex is missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET");
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: id,
      client_secret: secret,
    });
    const { ok, json } = await fetchJson(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    if (!ok || typeof json.access_token !== "string") return null;
    return {
      accessToken: json.access_token,
      refreshToken:
        typeof json.refresh_token === "string" ? json.refresh_token : refreshToken,
      expiresAt:
        typeof json.expires_in === "number"
          ? Date.now() + json.expires_in * 1000
          : undefined,
      refreshTokenExpiresAt:
        typeof json.refresh_token_expires_in === "number"
          ? Date.now() + json.refresh_token_expires_in * 1000
          : undefined,
    };
  }

  if (account.platform === "youtube") {
    const id = process.env.GOOGLE_CLIENT_ID;
    const secret = process.env.GOOGLE_CLIENT_SECRET;
    if (!id || !secret) throw new Error("Convex is missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    const body = new URLSearchParams({
      client_id: id,
      client_secret: secret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });
    const { ok, json } = await fetchJson("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!ok || typeof json.access_token !== "string") return null;
    return {
      accessToken: json.access_token,
      refreshToken,
      expiresAt:
        typeof json.expires_in === "number"
          ? Date.now() + json.expires_in * 1000
          : undefined,
    };
  }

  if (account.platform === "tiktok") {
    const key = process.env.TIKTOK_CLIENT_KEY;
    const secret = process.env.TIKTOK_CLIENT_SECRET;
    if (!key || !secret) throw new Error("Convex is missing TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET");
    const body = new URLSearchParams({
      client_key: key,
      client_secret: secret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
    const { ok, json } = await fetchJson(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    if (!ok || typeof json.access_token !== "string") return null;
    return {
      accessToken: json.access_token,
      refreshToken:
        typeof json.refresh_token === "string" ? json.refresh_token : refreshToken,
      expiresAt:
        typeof json.expires_in === "number"
          ? Date.now() + json.expires_in * 1000
          : undefined,
      refreshTokenExpiresAt:
        typeof json.refresh_expires_in === "number"
          ? Date.now() + json.refresh_expires_in * 1000
          : undefined,
    };
  }

  if (account.platform === "threads") {
    const { ok, json } = await fetchJson(
      `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${encodeURIComponent(refreshToken)}`,
    );
    if (!ok || typeof json.access_token !== "string") return null;
    const expiresAt =
      typeof json.expires_in === "number"
        ? Date.now() + json.expires_in * 1000
        : undefined;
    return {
      accessToken: json.access_token,
      refreshToken: json.access_token,
      expiresAt,
      refreshTokenExpiresAt: expiresAt,
    };
  }

  if (account.platform === "facebook" || account.platform === "instagram") {
    return refreshMetaPageToken(account.platform, refreshToken, account.providerAccountId);
  }

  return null;
}

