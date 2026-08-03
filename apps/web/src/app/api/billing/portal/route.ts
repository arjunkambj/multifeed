import DodoPayments from "dodopayments";
import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { api } from "@convex/_generated/api";
import {
  getDodoApiKey,
  getDodoEnvironment,
} from "@/lib/billing-config";
import {
  getHexclaveConvexServerToken,
  hexclaveServerApp,
} from "@/hexclave/server";
import { appOrigin, assertSameOrigin } from "@/lib/oauth/env";

const responseOptions = {
  headers: { "Cache-Control": "private, no-store" },
};

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status, ...responseOptions });

const fetchCurrentSubscription = (token: string) =>
  fetchQuery(api.billing.getSubscription, { nowMs: Date.now() }, { token });

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch {
    return errorResponse("Invalid request origin", 403);
  }

  const [user, token] = await Promise.all([
    hexclaveServerApp.getUser({ tokenStore: request }),
    getHexclaveConvexServerToken(request),
  ]);

  if (!user || !token) {
    return errorResponse("Unauthorized", 401);
  }

  const apiKey = getDodoApiKey();
  if (!apiKey) {
    return errorResponse("Dodo API key is not configured", 500);
  }

  let subscription: Awaited<ReturnType<typeof fetchCurrentSubscription>>;
  try {
    subscription = await fetchCurrentSubscription(token);
  } catch (error) {
    console.error(
      "[billing/portal-check]",
      error instanceof Error ? error.message : error,
    );
    return errorResponse("Could not verify subscription status", 503);
  }

  if (!subscription?.dodoCustomerId) {
    return errorResponse("No active customer billing portal found", 404);
  }

  const origin = appOrigin();
  const client = new DodoPayments({
    bearerToken: apiKey,
    environment: getDodoEnvironment(),
  });

  try {
    const portalSession = await client.customers.customerPortal.create(
      subscription.dodoCustomerId,
      {
        return_url: `${origin}/settings?tab=billing`,
      },
    );

    if (!portalSession?.link) {
      return errorResponse("Dodo did not return a portal link", 502);
    }

    return NextResponse.json(
      { url: portalSession.link },
      responseOptions,
    );
  } catch (error) {
    console.error(
      "[billing/portal]",
      error instanceof Error ? error.message : error,
    );
    return errorResponse("Could not open billing portal", 502);
  }
}
