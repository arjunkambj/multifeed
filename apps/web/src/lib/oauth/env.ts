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
  permission_denied:
    "You do not have permission to connect accounts for this team.",
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

/**
 * Relative app paths allowed as OAuth `returnTo` targets. Keep in sync with
 * `apps/backend/convex/oauth/returnPath.ts` — Convex re-validates server-side.
 */
const ALLOWED_RETURN_PREFIXES = [
  "/connections",
  "/posts",
  "/calendar",
  "/inbox",
  "/settings",
  "/billing",
  "/teams",
  "/overview",
] as const;

/**
 * Accept only same-app relative paths. Normalizes dot segments (`..`, `.`,
 * percent-encoded variants) via URL parsing *before* the prefix check, so a
 * raw string like `/connections/../sign-in` cannot pass validation and then
 * normalize outside the allowlist. Rejects protocol-relative (`//evil.com`),
 * backslashes, absolute URLs, and unknown prefixes.
 */
export function sanitizeReturnTo(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return undefined;
  if (trimmed.includes("\\") || trimmed.includes("://")) return undefined;
  if (trimmed.length > 512) return undefined;

  let url: URL;
  try {
    url = new URL(trimmed, "http://local.invalid");
  } catch {
    return undefined;
  }

  const allowed = ALLOWED_RETURN_PREFIXES.some(
    (prefix) =>
      url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
  );
  if (!allowed) return undefined;
  return `${url.pathname}${url.search}${url.hash}`;
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
