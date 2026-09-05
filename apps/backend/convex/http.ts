import { parseDodoWebhook } from "./billingWebhook";
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

    let event: ReturnType<typeof parseDodoWebhook>;
    try {
      event = parseDodoWebhook(
        rawBody,
        {
          "webhook-id": webhookId,
          "webhook-signature": signature,
          "webhook-timestamp": timestamp,
        },
        webhookKey,
      );
    } catch {
      console.error("[Dodo webhook] verification failed");
      return json({ error: "Invalid webhook" }, 401);
    }

    try {
      await ctx.runMutation(internal.billing.handleWebhook, {
        webhookId,
        eventType: event.type,
        eventTimestamp: parseTime(event.timestamp) ?? parseTime(timestamp),
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
