import DodoPayments from "dodopayments";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { api } from "@convex/_generated/api";
import { getPlan } from "@multifeed/plans";
import type { BillingInterval, PlanKey } from "@multifeed/plans";
import {
  getDodoApiKey,
  getDodoEnvironment,
  getDodoProductId,
} from "@/lib/billing-config";
import { serverEnv } from "@/env";
import {
  getHexclaveConvexServerToken,
  hexclaveServerApp,
} from "@/hexclave/server";

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

export async function POST(request: NextRequest) {
  const [user, token, payload] = await Promise.all([
    hexclaveServerApp.getUser({ tokenStore: request }),
    getHexclaveConvexServerToken(request),
    request.json().catch(() => ({})) as Promise<CheckoutPayload>,
  ]);

  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  if (!user.selectedTeam) {
    return errorResponse("No selected team", 400);
  }

  if (!user.primaryEmail) {
    return errorResponse("Billing requires a primary email", 400);
  }

  if (!token) {
    return errorResponse("Unauthorized", 401);
  }

  if (!isPlanKey(payload.planKey) || !isBillingInterval(payload.interval)) {
    return errorResponse("Invalid plan", 400);
  }

  const plan = getPlan(payload.planKey);
  const productId = getDodoProductId(payload.planKey, payload.interval);
  const apiKey = getDodoApiKey();

  if (!plan || !productId) {
    return errorResponse("Billing plan is not configured", 500);
  }

  if (!apiKey) {
    return errorResponse("Dodo API key is not configured", 500);
  }

  const origin = new URL(request.url).origin;
  const client = new DodoPayments({
    bearerToken: apiKey,
    environment: getDodoEnvironment(),
  });

  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
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

  if (!session.checkout_url) {
    return errorResponse("Dodo did not return a checkout URL", 502);
  }

  const convex = new ConvexHttpClient(serverEnv.NEXT_PUBLIC_CONVEX_URL);
  convex.setAuth(token);

  await convex.mutation(api.billing.startCheckout, {
    planKey: payload.planKey,
    interval: payload.interval,
    dodoProductId: productId,
    dodoCheckoutSessionId: session.session_id,
    dodoCheckoutUrl: session.checkout_url,
  });

  return NextResponse.json(
    { checkoutUrl: session.checkout_url },
    responseOptions,
  );
}
