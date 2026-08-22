import {
  META_GRAPH,
  META_OAUTH_DIALOG,
  THREADS_GRAPH,
  THREADS_GRAPH_VERSIONED,
} from "../../api-versions";
import { requireEnv } from "../../env";
import { oauthFetch } from "../http";
import type { AccountOption, AccountProfile, TokenBundle } from "../types";

const GRAPH = META_GRAPH;

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
  configurationId: string;
}) {
  const { appId } = metaAppCredentials();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: input.redirectUri,
    state: input.state,
    config_id: input.configurationId,
    response_type: "code",
    return_scopes: "true",
  });
  return `${META_OAUTH_DIALOG}?${params}`;
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
    scopes: (permissionsData.data ?? []).reduce<string[]>((acc, p) => {
      if (p.status === "granted" && p.permission) {
        acc.push(p.permission);
      }
      return acc;
    }, []),
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

const PAGE_FIELDS =
  "id,name,username,access_token,tasks,picture.type(large),instagram_business_account";

async function metaFetchPageCollection(
  startUrl: string,
  onError: "throw" | "ignore",
): Promise<MetaPage[]> {
  const pages: MetaPage[] = [];
  const seenCursors = new Set<string>();
  let url: string | undefined = startUrl;

  while (url) {
    const res = await oauthFetch(url);
    const data = (await res.json()) as {
      data?: MetaPage[];
      paging?: { cursors?: { after?: string }; next?: string };
      error?: { message?: string };
    };
    if (!res.ok) {
      if (onError === "ignore") return pages;
      throw new Error(data.error?.message ?? "Failed to list Facebook Pages");
    }
    pages.push(...(data.data ?? []));
    const nextCursor = data.paging?.next
      ? data.paging.cursors?.after
      : undefined;
    if (!nextCursor || seenCursors.has(nextCursor)) break;
    seenCursors.add(nextCursor);
    const next = new URL(url);
    next.searchParams.set("after", nextCursor);
    url = next.toString();
  }

  return pages;
}

export async function metaListPages(
  userAccessToken: string,
): Promise<MetaPage[]> {
  const seen = new Set<string>();
  const pages: MetaPage[] = [];

  const addPages = (batch: MetaPage[]) => {
    for (const page of batch) {
      if (!page.id || seen.has(page.id)) continue;
      seen.add(page.id);
      pages.push(page);
    }
  };

  const accounts = new URLSearchParams({
    fields: PAGE_FIELDS,
    access_token: userAccessToken,
    limit: "100",
  });
  addPages(
    await metaFetchPageCollection(`${GRAPH}/me/accounts?${accounts}`, "throw"),
  );

  // Pages granted through Business Manager often never appear on /me/accounts.
  try {
    const businessIds: string[] = [];
    const seenBiz = new Set<string>();
    let bizUrl: string | undefined =
      `${GRAPH}/me/businesses?${new URLSearchParams({
        access_token: userAccessToken,
        limit: "100",
      })}`;
    while (bizUrl) {
      const bizRes = await oauthFetch(bizUrl);
      const bizData = (await bizRes.json()) as {
        data?: Array<{ id?: string }>;
        paging?: { next?: string; cursors?: { after?: string } };
      };
      if (!bizRes.ok) break;
      for (const business of bizData.data ?? []) {
        if (business.id) businessIds.push(business.id);
      }
      const after = bizData.paging?.next
        ? bizData.paging.cursors?.after
        : undefined;
      if (!after || seenBiz.has(after)) break;
      seenBiz.add(after);
      const next = new URL(bizUrl);
      next.searchParams.set("after", after);
      bizUrl = next.toString();
    }
    for (const businessId of businessIds) {
      const pageParams = new URLSearchParams({
        fields: PAGE_FIELDS,
        access_token: userAccessToken,
        limit: "100",
      });
      for (const edge of ["owned_pages", "client_pages"] as const) {
        addPages(
          await metaFetchPageCollection(
            `${GRAPH}/${businessId}/${edge}?${pageParams}`,
            "ignore",
          ),
        );
      }
    }
  } catch {
    // business_management is optional; skip when the app is not approved for it
  }

  return pages;
}

export function pagesToFacebookOptions(pages: MetaPage[]): AccountOption[] {
  return pages.reduce<AccountOption[]>((acc, page) => {
    if (
      page.access_token &&
      (!page.tasks ||
        page.tasks.includes("CREATE_CONTENT") ||
        page.tasks.includes("MANAGE"))
    ) {
      acc.push({
        id: page.id,
        label: page.name,
        username: page.username ?? page.name,
        avatarUrl: page.picture?.data?.url,
        metadata: { pageAccessToken: page.access_token, pageId: page.id },
      });
    }
    return acc;
  }, []);
}

export function pagesToInstagramOptions(pages: MetaPage[]): AccountOption[] {
  return pages.reduce<AccountOption[]>((acc, page) => {
    if (page.access_token && page.instagram_business_account?.id) {
      acc.push({
        id: page.instagram_business_account.id,
        label: page.name,
        username: page.name,
        avatarUrl: page.picture?.data?.url,
        metadata: {
          pageAccessToken: page.access_token,
          pageId: page.id,
          igUserId: page.instagram_business_account.id,
        },
      });
    }
    return acc;
  }, []);
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
  const res = await oauthFetch(`${THREADS_GRAPH_VERSIONED}/me?${params}`);
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
