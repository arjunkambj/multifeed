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
  const origin = appOrigin();
  const value =
    optionalEnv("OAUTH_REDIRECT_URI") ?? `${origin}/api/oauth/callback`;
  const redirect = new URL(value);
  if (redirect.origin !== origin) {
    throw new Error("OAUTH_REDIRECT_URI must use the configured app origin");
  }
  return redirect.toString();
}

export function appOrigin(): string {
  const configured =
    optionalEnv("APP_ORIGIN") ?? optionalEnv("NEXT_PUBLIC_APP_URL");
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("Missing APP_ORIGIN or NEXT_PUBLIC_APP_URL");
  }

  const url = new URL(configured ?? "http://localhost:3000");
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (
    process.env.NODE_ENV === "production" &&
    url.protocol !== "https:" &&
    !isLocal
  ) {
    throw new Error("Production app origin must use HTTPS");
  }
  return url.origin;
}

/** Shared only by Next.js route handlers and Convex OAuth mutations. */
export function oauthServerSecret(): string {
  const value = requireEnv("OAUTH_SERVER_SECRET");
  if (value.length < 32) {
    throw new Error("OAUTH_SERVER_SECRET must be at least 32 characters");
  }
  return value;
}

/** Relative app paths we allow after OAuth (blocks open redirects). */
const ALLOWED_RETURN_PREFIXES = [
  "/connections",
  "/posts",
  "/calendar",
  "/inbox",
  "/settings",
  "/billing",
  "/team",
  "/overview",
] as const;

/**
 * Accept only same-app relative paths. Rejects protocol-relative (`//evil.com`),
 * backslashes, absolute URLs, and unknown prefixes.
 */
export function sanitizeReturnTo(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return undefined;
  if (trimmed.includes("\\") || trimmed.includes("://")) return undefined;
  if (trimmed.length > 512) return undefined;

  const pathOnly = trimmed.split("?")[0]!.split("#")[0]!;
  const allowed = ALLOWED_RETURN_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`),
  );
  if (!allowed) return undefined;
  return trimmed;
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
  selection_failed: "Could not complete account selection. Please try again.",
  start_failed: "Could not start connection. Please try again.",
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
): string {
  const safeReturn = sanitizeReturnTo(returnTo) ?? "/connections";
  const url = new URL(safeReturn, "http://local.invalid");
  url.searchParams.set("connected", platform);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function selectAccountUrl(state: string, platform: string): string {
  const u = new URL("/connections/select", appOrigin());
  u.searchParams.set("state", state);
  u.searchParams.set("platform", platform);
  return u.toString();
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
