import { Webhook } from "svix";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { parseTime } from "./billing";

const http = httpRouter();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function verifySignature(
  rawBody: string,
  headers: {
    webhookId: string;
    signature: string;
    timestamp: string;
  },
  secret: string,
): Promise<boolean> {
  try {
    const svixSecret = secret.startsWith("whsec_") ? secret : `whsec_${secret}`;
    new Webhook(svixSecret).verify(rawBody, {
      "webhook-id": headers.webhookId,
      "webhook-signature": headers.signature,
      "webhook-timestamp": headers.timestamp,
    });
    return true;
  } catch {
    // Fall through to Web Crypto HMAC fallback
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signedBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(`${headers.timestamp}.${rawBody}`),
    );
    const bytes = new Uint8Array(signedBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    const expectedBase64 = btoa(binary);
    const providedSig = headers.signature.includes(",")
      ? (headers.signature.split(",")[1] ?? "")
      : headers.signature;

    return expectedBase64 === providedSig;
  } catch {
    // Ignore verification errors
  }

  return false;
}

http.route({
  path: "/webhook/dodopayment",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookKey =
      process.env.DODO_PAYMENTS_WEBHOOK_SECRET ??
      process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    if (!webhookKey) return json({ error: "Missing webhook key" }, 500);

    const rawBody = await request.text();
    const webhookId = request.headers.get("webhook-id") ?? "";
    const signature = request.headers.get("webhook-signature") ?? "";
    const timestamp = request.headers.get("webhook-timestamp") ?? "";

    if (
      !(await verifySignature(
        rawBody,
        { webhookId, signature, timestamp },
        webhookKey,
      ))
    ) {
      console.error("[Dodo webhook] signature rejected");
      return json({ error: "Invalid webhook" }, 401);
    }

    // Timestamp freshness check (5 minute tolerance to prevent replay attacks)
    const eventTime = parseTime(timestamp);
    if (eventTime && Math.abs(Date.now() - eventTime) > 300000) {
      console.error("[Dodo webhook] timestamp too old");
      return json({ error: "Timestamp too old" }, 401);
    }

    let event: {
      type: string;
      timestamp?: string | number;
      data?: unknown;
    };

    try {
      event = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON payload" }, 400);
    }

    try {
      await ctx.runMutation(internal.billing.handleWebhook, {
        webhookId,
        eventType: event.type,
        eventTimestamp: parseTime(event.timestamp) ?? eventTime,
        rawEvent: event,
        data: event.data ?? {},
      });

      return json({ received: true });
    } catch (error) {
      console.error("[Dodo webhook] processing failed", error);
      return json({ error: "Webhook processing failed" }, 500);
    }
  }),
});

export default http;
