import { fetchMutation } from "convex/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { api } from "@convex/_generated/api";
import { getHexclaveConvexServerToken } from "@/hexclave/server";
import { getConnector, isOAuthPlatform } from "@/lib/oauth/connectors/registry";
import {
  assertSameOrigin,
  connectedReturnPath,
  oauthServerSecret,
} from "@/lib/oauth/env";
import { saveConnectedAccount } from "@/lib/oauth/save-account";

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
    state?: unknown;
    optionId?: unknown;
  };

  if (typeof body.state !== "string" || typeof body.optionId !== "string") {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, ...responseOptions },
    );
  }

  let serverSecret: string;
  try {
    serverSecret = oauthServerSecret();
  } catch (err) {
    console.error(
      "[oauth/complete-selection] server configuration",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: "OAuth server is not configured." },
      { status: 500, ...responseOptions },
    );
  }

  const attemptId = crypto.randomUUID();

  try {
    // Lock this selection so concurrent submissions cannot consume it twice.
    const pending = await fetchMutation(
      api.oauth.sessions.takePending,
      {
        state: body.state,
        optionId: body.optionId,
        attemptId,
        serverSecret,
      },
      { token },
    );

    if (!isOAuthPlatform(pending.platform)) {
      throw new Error("Unsupported platform");
    }

    const connector = getConnector(pending.platform);
    if (!connector.resolveSelectedAccount) {
      throw new Error("This platform does not support account selection");
    }

    const resolved = await connector.resolveSelectedAccount(
      pending.accessToken,
      body.optionId,
      pending.option,
    );

    await saveConnectedAccount({
      token,
      platform: pending.platform,
      connector,
      tokens: resolved.tokens,
      profile: resolved.profile,
    });

    await fetchMutation(
      api.oauth.sessions.remove,
      { state: body.state, serverSecret },
      { token },
    );

    // Prefer relative path so the client never follows an absolute cross-origin URL.
    return NextResponse.json(
      {
        ok: true,
        platform: pending.platform,
        redirectTo: connectedReturnPath(pending.returnTo, pending.platform),
      },
      responseOptions,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not complete selection";
    console.error("[oauth/complete-selection]", message);
    await fetchMutation(
      api.oauth.sessions.restorePending,
      { state: body.state, attemptId, serverSecret },
      { token },
    ).catch(() => undefined);
    const isLimit = message.toLowerCase().includes("limit");
    const isExpired =
      message.toLowerCase().includes("expired") ||
      message.toLowerCase().includes("not found");
    return NextResponse.json(
      {
        error: isLimit
          ? message
          : isExpired
            ? "Selection session expired. Please reconnect."
            : "Could not complete account selection. Please try again.",
      },
      { status: isLimit || isExpired ? 400 : 500, ...responseOptions },
    );
  }
}
