import { requireEnv } from "../../env";
import { oauthFetch } from "../http";
import type { AccountOption, AccountProfile, TokenBundle } from "../types";

const GRAPH = "https://graph.facebook.com/v24.0";
const THREADS_GRAPH = "https://graph.threads.net";

export function metaAppCredentials() {
  return {
    appId: requireEnv("META_APP_ID"),
    appSecret: requireEnv("META_APP_SECRET"),
  };
}

export function threadsAppCredentials() {
  return {
    appId: requireEnv("THREADS_APP_ID"),
    appSecret: requireEnv("THREADS_APP_SECRET"),
  };
}

export function metaAuthorizeUrl(input: {
  state: string;
  redirectUri: string;
  scopes: string[];
}): string {
  const { appId } = metaAppCredentials();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: input.redirectUri,
    state: input.state,
    scope: input.scopes.join(","),
    response_type: "code",
    return_scopes: "true",
  });
  return `https://www.facebook.com/v24.0/dialog/oauth?${params}`;
}

export async function metaExchangeCode(input: {
  code: string;
  redirectUri: string;
}): Promise<TokenBundle> {
  const { appId, appSecret } = metaAppCredentials();
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: input.redirectUri,
    code: input.code,
  });
  const res = await oauthFetch(`${GRAPH}/oauth/access_token?${params}`);
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error?.message ?? "Meta token exchange failed");
  }

  const longParams = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: data.access_token,
  });
  const longRes = await oauthFetch(`${GRAPH}/oauth/access_token?${longParams}`);
  const longData = (await longRes.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!longRes.ok || !longData.access_token) {
    throw new Error(
      longData.error?.message ?? "Meta long-lived token exchange failed",
    );
  }

  const permissionsParams = new URLSearchParams({
    access_token: longData.access_token,
  });
  const permissionsRes = await oauthFetch(
    `${GRAPH}/me/permissions?${permissionsParams}`,
  );
  const permissionsData = (await permissionsRes.json()) as {
    data?: Array<{ permission?: string; status?: string }>;
    error?: { message?: string };
  };
  if (!permissionsRes.ok) {
    throw new Error(
      permissionsData.error?.message ?? "Meta permission lookup failed",
    );
  }

  const expiresAt = longData.expires_in
    ? Date.now() + longData.expires_in * 1000
    : undefined;

  return {
    accessToken: longData.access_token,
    expiresAt,
    scopes: (permissionsData.data ?? [])
      .filter(({ status }) => status === "granted")
      .flatMap(({ permission }) => (permission ? [permission] : [])),
    tokenType: "user",
  };
}

export async function metaFetchMe(
  accessToken: string,
): Promise<AccountProfile> {
  const params = new URLSearchParams({
    fields: "id,name,picture.type(large)",
    access_token: accessToken,
  });
  const res = await oauthFetch(`${GRAPH}/me?${params}`);
  const data = (await res.json()) as {
    id?: string;
    name?: string;
    picture?: { data?: { url?: string } };
    error?: { message?: string };
  };
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message ?? "Meta profile fetch failed");
  }
  return {
    providerAccountId: data.id,
    username: data.name ?? data.id,
    displayName: data.name,
    avatarUrl: data.picture?.data?.url,
    tokenType: "user",
  };
}

export type MetaPage = {
  id: string;
  name: string;
  username?: string;
  access_token?: string;
  tasks?: string[];
  picture?: { data?: { url?: string } };
  instagram_business_account?: { id: string };
};

export async function metaListPages(
  userAccessToken: string,
): Promise<MetaPage[]> {
  const pages: MetaPage[] = [];
  const seenCursors = new Set<string>();
  let after: string | undefined;

  do {
    const params = new URLSearchParams({
      fields:
        "id,name,username,access_token,tasks,picture.type(large),instagram_business_account",
      access_token: userAccessToken,
      limit: "100",
    });
    if (after) params.set("after", after);

    const res = await oauthFetch(`${GRAPH}/me/accounts?${params}`);
    const data = (await res.json()) as {
      data?: MetaPage[];
      paging?: { cursors?: { after?: string }; next?: string };
      error?: { message?: string };
    };
    if (!res.ok) {
      throw new Error(data.error?.message ?? "Failed to list Facebook Pages");
    }

    pages.push(...(data.data ?? []));
    const nextCursor = data.paging?.next
      ? data.paging.cursors?.after
      : undefined;
    if (!nextCursor || seenCursors.has(nextCursor)) break;
    seenCursors.add(nextCursor);
    after = nextCursor;
  } while (after);

  return pages;
}

export function pagesToFacebookOptions(pages: MetaPage[]): AccountOption[] {
  return pages
    .filter(
      (page) =>
        Boolean(page.access_token) &&
        (!page.tasks ||
          page.tasks.includes("CREATE_CONTENT") ||
          page.tasks.includes("MANAGE")),
    )
    .map((page) => ({
      id: page.id,
      label: page.name,
      username: page.username ?? page.name,
      avatarUrl: page.picture?.data?.url,
      metadata: { pageAccessToken: page.access_token, pageId: page.id },
    }));
}

export function pagesToInstagramOptions(pages: MetaPage[]): AccountOption[] {
  return pages
    .filter((p) => p.access_token && p.instagram_business_account?.id)
    .map((page) => ({
      id: page.instagram_business_account!.id,
      label: page.name,
      username: page.name,
      avatarUrl: page.picture?.data?.url,
      metadata: {
        pageAccessToken: page.access_token,
        pageId: page.id,
        igUserId: page.instagram_business_account!.id,
      },
    }));
}

export async function metaFetchIgProfile(
  pageAccessToken: string,
  igUserId: string,
): Promise<AccountProfile> {
  const params = new URLSearchParams({
    fields: "id,username,name,profile_picture_url",
    access_token: pageAccessToken,
  });
  const res = await oauthFetch(`${GRAPH}/${igUserId}?${params}`);
  const data = (await res.json()) as {
    id?: string;
    username?: string;
    name?: string;
    profile_picture_url?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message ?? "Instagram profile fetch failed");
  }
  return {
    providerAccountId: data.id,
    username: data.username ?? data.id,
    displayName: data.name ?? data.username,
    avatarUrl: data.profile_picture_url,
    tokenType: "page",
    metadata: { igUserId: data.id },
  };
}

export function threadsAuthorizeUrl(input: {
  state: string;
  redirectUri: string;
  scopes: string[];
}): string {
  const { appId } = threadsAppCredentials();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: input.redirectUri,
    state: input.state,
    scope: input.scopes.join(","),
    response_type: "code",
  });
  return `https://threads.net/oauth/authorize?${params}`;
}

export async function threadsExchangeCodeNative(input: {
  code: string;
  redirectUri: string;
}): Promise<TokenBundle> {
  const { appId, appSecret } = threadsAppCredentials();
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: input.redirectUri,
    code: input.code,
  });
  const res = await oauthFetch(`${THREADS_GRAPH}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
    error_message?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error?.message ??
        data.error_message ??
        "Threads token exchange failed",
    );
  }

  const longParams = new URLSearchParams({
    grant_type: "th_exchange_token",
    client_secret: appSecret,
    access_token: data.access_token,
  });
  const longRes = await oauthFetch(
    `${THREADS_GRAPH}/access_token?${longParams}`,
  );
  const longData = (await longRes.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!longRes.ok || !longData.access_token) {
    throw new Error(
      longData.error?.message ?? "Threads long-lived token exchange failed",
    );
  }

  const expiresAt = longData.expires_in
    ? Date.now() + longData.expires_in * 1000
    : undefined;

  return {
    accessToken: longData.access_token,
    // Threads refreshes a long-lived access token with that same token.
    refreshToken: longData.access_token,
    expiresAt,
    refreshTokenExpiresAt: expiresAt,
    scopes: [],
    tokenType: "user",
  };
}

export async function threadsRefreshAccessToken(
  longLivedToken: string,
): Promise<TokenBundle> {
  const params = new URLSearchParams({
    grant_type: "th_refresh_token",
    access_token: longLivedToken,
  });
  const res = await oauthFetch(
    `${THREADS_GRAPH}/refresh_access_token?${params}`,
  );
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error?.message ?? "Threads token refresh failed");
  }
  const expiresAt = data.expires_in
    ? Date.now() + data.expires_in * 1000
    : undefined;
  return {
    accessToken: data.access_token,
    refreshToken: data.access_token,
    expiresAt,
    refreshTokenExpiresAt: expiresAt,
    scopes: [],
    tokenType: "user",
  };
}

export async function threadsFetchProfile(
  accessToken: string,
): Promise<AccountProfile> {
  const params = new URLSearchParams({
    fields: "id,username,name,threads_profile_picture_url",
    access_token: accessToken,
  });
  const res = await oauthFetch(`${THREADS_GRAPH}/v1.0/me?${params}`);
  const data = (await res.json()) as {
    id?: string;
    username?: string;
    name?: string;
    threads_profile_picture_url?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message ?? "Threads profile fetch failed");
  }
  return {
    providerAccountId: data.id,
    username: data.username ?? data.id,
    displayName: data.name ?? data.username,
    avatarUrl: data.threads_profile_picture_url,
    tokenType: "user",
  };
}
