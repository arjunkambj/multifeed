import { httpRouter } from "convex/server";
import { webhookDodopayment } from "./webhooks/dodo";

const http = httpRouter();

http.route({
  path: "/webhook/dodopayment",
  method: "POST",
  handler: webhookDodopayment,
});

export default http;
