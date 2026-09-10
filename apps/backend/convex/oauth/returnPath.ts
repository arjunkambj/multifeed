/** Relative app paths we allow after OAuth (blocks open redirects). */
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

/** Parsing base — only used to normalize the path, never returned. */
const RETURN_BASE = "https://multifeed.invalid";

/**
 * Accept only same-app relative paths. Rejects protocol-relative (`//evil.com`),
 * backslashes, absolute URLs, and unknown prefixes.
 *
 * The path is normalized with the WHATWG URL parser BEFORE the allowlist check
 * so traversal segments (`/connections/../settings`) and percent-encoded dots
 * (`%2e%2e`) cannot smuggle the raw string past the prefix check only to
 * collapse outside the allowlist in the browser. The returned value is the
 * normalized `pathname + search`, never the raw input.
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
    url = new URL(trimmed, RETURN_BASE);
  } catch {
    return undefined;
  }

  // Belt-and-suspenders: the input cannot redirect off-origin (the checks above
  // reject `//host`, `scheme://`, and backslashes), but never trust the raw
  // string — only the normalized result is validated and returned.
  if (url.origin !== RETURN_BASE) return undefined;

  const allowed = ALLOWED_RETURN_PREFIXES.some(
    (prefix) =>
      url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
  );
  if (!allowed) return undefined;

  return `${url.pathname}${url.search}`;
}
