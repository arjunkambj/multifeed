import { fetchMutation } from "convex/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { api } from "@convex/_generated/api";
import { getHexclaveConvexServerToken } from "@/hexclave/server";
import { getConnector, isOAuthPlatform } from "@/lib/oauth/connectors/registry";
import {
  assertSameOrigin,
  oauthServerSecret,
  oauthRedirectUri,
  sanitizeReturnTo,
} from "@/lib/oauth/env";
import { pkceChallenge } from "@/lib/oauth/pkce";

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

  const token = await getHexclaveConvexServerToken(request);
  if (token == null) {
    return NextResponse.json(
      { error: "Unauthenticated" },
      { status: 401, ...responseOptions },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    platform?: unknown;
    returnTo?: unknown;
  };

  if (typeof body.platform !== "string" || !isOAuthPlatform(body.platform)) {
    return NextResponse.json(
      { error: "Invalid platform" },
      { status: 400, ...responseOptions },
    );
  }

  const returnTo = sanitizeReturnTo(body.returnTo);
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

    return NextResponse.json({ url, state: session.state }, responseOptions);
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
