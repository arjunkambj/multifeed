import { sanitizeReturnTo } from "@convex/oauth/returnPath";
export { sanitizeReturnTo } from "@convex/oauth/returnPath";
import { clientEnv } from "@/env";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

/** Registered on every provider console. */
export function oauthRedirectUri(): string {
  return new URL("/api/oauth/callback", appOrigin()).toString();
}

export function appOrigin(): string {
  return new URL(clientEnv.NEXT_PUBLIC_APP_URL).origin;
}

/** Shared only by Next.js route handlers and Convex OAuth mutations. */
export function oauthServerSecret(): string {
  const value = requireEnv("OAUTH_SERVER_SECRET");
  if (value.length < 32) {
    throw new Error("OAUTH_SERVER_SECRET must be at least 32 characters");
  }
  return value;
}

/** Stable user-facing OAuth error codes (never raw provider messages). */
export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  auth_required: "Sign in to finish connecting your account.",
  missing_code: "Missing OAuth code or state. Please try again.",
  session_expired: "OAuth session expired. Please try again.",
  unsupported_platform: "Unsupported platform.",
  no_accounts:
    "No pages or accounts found for this login. Check permissions and try again.",
  no_instagram: "No Instagram professional accounts found for this login.",
  oauth_denied: "Connection was cancelled or denied.",
  oauth_failed: "Could not complete connection. Please try again.",
  token_exchange_failed:
    "Could not exchange authorization code. Please try again.",
  account_limit:
    "Your plan limit was reached. Upgrade your plan to connect more accounts.",
};

export function oauthErrorMessage(code: string): string {
  return OAUTH_ERROR_MESSAGES[code] ?? OAUTH_ERROR_MESSAGES.oauth_failed!;
}

export function connectionsUrl(query?: Record<string, string>): string {
  const u = new URL("/connections", appOrigin());
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      u.searchParams.set(k, v);
    }
  }
  return u.toString();
}

export function connectedReturnPath(
  returnTo: unknown,
  platform: string,
  skippedCount = 0,
): string {
  const safeReturn = sanitizeReturnTo(returnTo) ?? "/connections";
  const url = new URL(safeReturn, "http://local.invalid");
  url.searchParams.set("connected", platform);
  if (skippedCount > 0) {
    url.searchParams.set("skipped", String(skippedCount));
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Reject cross-site POSTs (defense-in-depth alongside cookie SameSite). */
export function assertSameOrigin(request: {
  headers: { get(name: string): string | null };
}): void {
  const origin = request.headers.get("origin");
  if (!origin) throw new Error("Missing request origin");
  const expected = appOrigin();
  if (origin !== expected) {
    throw new Error("Invalid request origin");
  }
}

export { requireEnv, optionalEnv };
