import { fetchMutation } from "convex/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { api } from "@convex/_generated/api";
import { getHexclaveConvexServerToken } from "@/hexclave/server";
import { getConnector, isOAuthPlatform } from "@/lib/oauth/connectors/registry";
import {
  appOrigin,
  connectedReturnPath,
  connectionsUrl,
  oauthRedirectUri,
  oauthServerSecret,
} from "@/lib/oauth/env";
import { saveConnectedAccounts } from "@/lib/oauth/save-account";

function redirect(url: string) {
  return NextResponse.redirect(url, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

function errorRedirect(code: string) {
  return redirect(connectionsUrl({ error: code }));
}

function connectedRedirect(returnTo: unknown, platform: string) {
  return redirect(
    new URL(connectedReturnPath(returnTo, platform), appOrigin()).toString(),
  );
}

export async function GET(request: NextRequest) {
  const token = await getHexclaveConvexServerToken(request);
  if (token == null) {
    // Never put the OAuth `code` into sign-in returnTo (history/logs/Referer).
    const signIn = new URL("/sign-in", appOrigin());
    signIn.searchParams.set("returnTo", "/connections");
    signIn.searchParams.set("error", "auth_required");
    return redirect(signIn.toString());
  }

  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) {
    console.error(
      "[oauth/callback] provider error",
      error,
      url.searchParams.get("error_description"),
    );
    return errorRedirect(
      error === "access_denied" ? "oauth_denied" : "oauth_failed",
    );
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return errorRedirect("missing_code");
  }

  let serverSecret: string;
  try {
    serverSecret = oauthServerSecret();
  } catch (err) {
    console.error(
      "[oauth/callback] server configuration",
      err instanceof Error ? err.message : err,
    );
    return errorRedirect("oauth_failed");
  }

  try {
    // Atomically consume authorize session (single-use; no PKCE via public query).
    const session = await fetchMutation(
      api.oauth.sessions.beginExchange,
      { state, serverSecret },
      { token },
    );

    if (!session) {
      return errorRedirect("session_expired");
    }

    if (session.status === "completed") {
      return connectedRedirect(session.returnTo, session.platform);
    }
    if (session.status === "in_progress") {
      return redirect(connectionsUrl());
    }

    if (!isOAuthPlatform(session.platform)) {
      return errorRedirect("unsupported_platform");
    }

    const connector = getConnector(session.platform);
    const redirectUri = oauthRedirectUri();
    let tokens;
    try {
      tokens = await connector.exchangeCode({
        code,
        redirectUri,
        codeVerifier: session.codeVerifier,
      });
    } catch (err) {
      console.error(
        "[oauth/callback] token exchange",
        err instanceof Error ? err.message : err,
      );
      await fetchMutation(
        api.oauth.sessions.remove,
        { state, serverSecret },
        { token },
      ).catch(() => undefined);
      return errorRedirect("token_exchange_failed");
    }

    // Meta (and similar): resolve every discovered account before one atomic save.
    if (connector.listAccounts) {
      const options = await connector.listAccounts(tokens.accessToken);

      if (options.length === 0) {
        await fetchMutation(
          api.oauth.sessions.remove,
          { state, serverSecret },
          { token },
        );
        return errorRedirect(
          session.platform === "instagram" ? "no_instagram" : "no_accounts",
        );
      }

      if (!connector.resolveAccount) {
        throw new Error(
          `${session.platform} account resolution is unavailable`,
        );
      }

      const accounts = [];
      for (const option of options) {
        accounts.push(
          await connector.resolveAccount(tokens, option.id, option),
        );
      }

      await saveConnectedAccounts({
        token,
        platform: session.platform,
        connector,
        accounts,
      });

      await fetchMutation(
        api.oauth.sessions.complete,
        { state, serverSecret },
        { token },
      );
      return connectedRedirect(session.returnTo, session.platform);
    }

    const profile = await connector.fetchProfile(tokens.accessToken);
    await saveConnectedAccounts({
      token,
      platform: session.platform,
      connector,
      accounts: [{ tokens, profile }],
    });
    await fetchMutation(
      api.oauth.sessions.complete,
      { state, serverSecret },
      { token },
    );

    return connectedRedirect(session.returnTo, session.platform);
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth failed";
    console.error("[oauth/callback]", message);
    try {
      if (state) {
        await fetchMutation(
          api.oauth.sessions.remove,
          { state, serverSecret },
          { token },
        );
      }
    } catch {
      // ignore cleanup errors
    }
    return errorRedirect(
      message.toLowerCase().includes("limit")
        ? "account_limit"
        : "oauth_failed",
    );
  }
}
