import { Webhook } from "svix";

type WebhookEvent = Record<string, unknown> & {
  type: string;
  timestamp?: string | number;
  data?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Verify the raw body before interpreting any event fields. */
export function parseDodoWebhook(
  rawBody: string,
  headers: Record<string, string>,
  secret: string,
) {
  const signingSecret = secret.startsWith("whsec_")
    ? secret
    : `whsec_${secret}`;
  const event: unknown = new Webhook(signingSecret).verify(rawBody, headers);

  if (!isRecord(event) || typeof event.type !== "string" || !event.type) {
    throw new Error("Invalid webhook event type.");
  }
  if (event.data !== undefined && !isRecord(event.data)) {
    throw new Error("Invalid webhook event data.");
  }
  if (
    event.timestamp !== undefined &&
    typeof event.timestamp !== "string" &&
    typeof event.timestamp !== "number"
  ) {
    throw new Error("Invalid webhook event timestamp.");
  }

  return event as WebhookEvent;
}
