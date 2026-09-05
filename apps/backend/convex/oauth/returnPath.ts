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
