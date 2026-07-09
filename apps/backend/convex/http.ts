import { Webhook } from "svix";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

http.route({
  path: "/webhook/dodopayment",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    if (!webhookKey) return json({ error: "Missing webhook key" }, 500);

    const rawBody = await request.text();
    const headers = {
      "webhook-id": request.headers.get("webhook-id") ?? "",
      "webhook-signature": request.headers.get("webhook-signature") ?? "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
    };

    try {
      const event = new Webhook(webhookKey).verify(rawBody, headers) as {
        type: string;
        timestamp?: string;
        data?: unknown;
      };

      await ctx.runMutation(internal.billing.handleWebhook, {
        webhookId: headers["webhook-id"],
        eventType: event.type,
        eventTimestamp: parseTime(event.timestamp),
        rawEvent: event,
        data: event.data ?? {},
      });

      return json({ received: true });
    } catch (error) {
      console.error("[Dodo webhook] rejected", error);
      return json({ error: "Invalid webhook" }, 401);
    }
  }),
});

function parseTime(value: unknown) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    return undefined;
  }
  return Date.parse(value);
}

export default http;
