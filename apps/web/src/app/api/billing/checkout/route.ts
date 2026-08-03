import DodoPayments from "dodopayments";
import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { api } from "@convex/_generated/api";
import { FREE_TRIAL, type BillingInterval, type PlanKey } from "@multifeed/plans";
import {
  getDodoApiKey,
  getDodoEnvironment,
  getDodoProductId,
} from "@/lib/billing-config";
import {
  getHexclaveConvexServerToken,
  hexclaveServerApp,
} from "@/hexclave/server";
import { appOrigin, assertSameOrigin } from "@/lib/oauth/env";

type CheckoutPayload = {
  planKey?: unknown;
  interval?: unknown;
};

const responseOptions = {
  headers: { "Cache-Control": "private, no-store" },
};

const isPlanKey = (value: unknown): value is PlanKey =>
  value === "creator" || value === "growth" || value === "agency";

const isBillingInterval = (value: unknown): value is BillingInterval =>
  value === "month" || value === "year";

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

  const [user, token, payload] = await Promise.all([
    hexclaveServerApp.getUser({ tokenStore: request }),
    getHexclaveConvexServerToken(request),
    request.json().catch(() => ({})) as Promise<CheckoutPayload>,
  ]);

  if (!user || !token) {
    return errorResponse("Unauthorized", 401);
  }

  if (!user.selectedTeam) {
    return errorResponse("No selected team", 400);
  }

  if (!user.primaryEmail) {
    return errorResponse("Billing requires a primary email", 400);
  }

  if (!isPlanKey(payload.planKey) || !isBillingInterval(payload.interval)) {
    return errorResponse("Invalid plan", 400);
  }

  const productId = getDodoProductId(payload.planKey, payload.interval);
  const apiKey = getDodoApiKey();

  if (!productId) {
    return errorResponse("Billing plan is not configured", 500);
  }

  if (!apiKey) {
    return errorResponse("Dodo API key is not configured", 500);
  }

  let subscription: Awaited<ReturnType<typeof fetchCurrentSubscription>>;
  try {
    subscription = await fetchCurrentSubscription(token);
  } catch (error) {
    console.error(
      "[billing/subscription-check]",
      error instanceof Error ? error.message : error,
    );
    return errorResponse("Could not verify subscription status", 503);
  }

  if (subscription && !subscription.canStartCheckout) {
    return errorResponse(
      "An existing subscription must be managed before starting a new checkout",
      409,
    );
  }

  const origin = appOrigin();
  const client = new DodoPayments({
    bearerToken: apiKey,
    environment: getDodoEnvironment(),
  });

  let session: Awaited<ReturnType<typeof client.checkoutSessions.create>>;
  try {
    session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      subscription_data: {
        trial_period_days: FREE_TRIAL.days,
      },
      customer: {
        email: user.primaryEmail,
        name: user.displayName,
      },
      metadata: {
        teamId: user.selectedTeam.id,
        userId: user.id,
        planKey: payload.planKey,
        interval: payload.interval,
      },
      return_url: `${origin}/settings?tab=billing&checkout=complete`,
      cancel_url: `${origin}/settings?tab=billing&checkout=cancelled`,
    });
  } catch (error) {
    console.error(
      "[billing/checkout]",
      error instanceof Error ? error.message : error,
    );
    return errorResponse("Could not start checkout", 502);
  }

  if (!session.checkout_url) {
    return errorResponse("Dodo did not return a checkout URL", 502);
  }

  return NextResponse.json(
    { checkoutUrl: session.checkout_url },
    responseOptions,
  );
}
