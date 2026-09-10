import { fetchMutation } from "convex/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { api } from "@convex/_generated/api";
import {
  getHexclaveConvexServerToken,
  hexclaveServerApp,
} from "@/hexclave/server";
import { getConnector, isOAuthPlatform } from "@/lib/oauth/connectors/registry";
import {
  assertSameOrigin,
  oauthServerSecret,
  oauthRedirectUri,
  sanitizeReturnTo,
} from "@/lib/oauth/env";
import { pkceChallenge } from "@/lib/oauth/pkce";
import { MANAGE_CONNECTIONS_PERMISSION } from "@/lib/team-permissions";

const responseOptions = {
  headers: { "Cache-Control": "private, no-store" },
};

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403, ...responseOptions },
    );
  }

  const auth = await Promise.all([
    hexclaveServerApp.getUser({ tokenStore: request }),
    getHexclaveConvexServerToken(request),
    request.json().catch(() => null) as Promise<unknown>,
  ]).catch((error) => {
    console.error(
      "[oauth/start-auth]",
      error instanceof Error ? error.message : error,
    );
    return null;
  });
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthenticated" },
      { status: 401, ...responseOptions },
    );
  }

  const [user, token, body] = auth;
  if (!user || token == null) {
    return NextResponse.json(
      { error: "Unauthenticated" },
      { status: 401, ...responseOptions },
    );
  }

  const team = user.selectedTeam;
  if (!team) {
    return NextResponse.json(
      { error: "No selected team" },
      { status: 400, ...responseOptions },
    );
  }

  let canManageConnections: boolean;
  try {
    canManageConnections = await user.hasPermission(
      team,
      MANAGE_CONNECTIONS_PERMISSION,
    );
  } catch (error) {
    console.error(
      "[oauth/start-permission]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Could not verify permissions" },
      { status: 502, ...responseOptions },
    );
  }
  if (!canManageConnections) {
    return NextResponse.json(
      { error: "You do not have permission to connect accounts for this team" },
      { status: 403, ...responseOptions },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("platform" in body) ||
    typeof body.platform !== "string" ||
    !isOAuthPlatform(body.platform)
  ) {
    return NextResponse.json(
      { error: "Invalid platform" },
      { status: 400, ...responseOptions },
    );
  }

  const returnTo = sanitizeReturnTo(
    "returnTo" in body ? body.returnTo : undefined,
  );
  let serverSecret: string | undefined;
  let state: string | undefined;

  try {
    serverSecret = oauthServerSecret();
    const connector = getConnector(body.platform);
    const session = await fetchMutation(
      api.oauth.sessions.create,
      {
        serverSecret,
        platform: body.platform,
        returnTo,
        usePkce: connector.requiresPkce,
      },
      { token },
    );
    state = session.state;

    const codeChallenge = session.codeVerifier
      ? await pkceChallenge(session.codeVerifier)
      : undefined;

    const url = connector.buildAuthorizeUrl({
      state: session.state,
      redirectUri: oauthRedirectUri(),
      codeChallenge,
    });

    return NextResponse.json({ url }, responseOptions);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not start OAuth";
    console.error("[oauth/start]", message);
    if (state && serverSecret) {
      await fetchMutation(
        api.oauth.sessions.remove,
        { state, serverSecret },
        { token },
      ).catch(() => undefined);
    }
    // Surface plan-limit messages; map unknown errors.
    const isLimit = message.toLowerCase().includes("limit");
    return NextResponse.json(
      {
        error: isLimit
          ? message
          : "Could not start connection. Please try again.",
      },
      { status: isLimit ? 400 : 500, ...responseOptions },
    );
  }
}
