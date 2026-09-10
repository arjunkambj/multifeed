import { fail } from "../errors";

const MIN_SECRET_LENGTH = 32;

const constantTimeEqual = (provided: string, expected: string) => {
  // The expected secret's length is not secret (see MIN_SECRET_LENGTH), so a
  // length mismatch can reject immediately — this also bounds the loop below
  // to the configured secret length regardless of attacker-controlled input.
  if (provided.length !== expected.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  }

  return mismatch === 0;
};

/** Proves a caller is the trusted Next.js server, not an authenticated browser. */
export const requireOAuthServer = (providedSecret: string) => {
  const expectedSecret = process.env.OAUTH_SERVER_SECRET;
  if (!expectedSecret || expectedSecret.length < MIN_SECRET_LENGTH) {
    fail("INTERNAL_ERROR", "OAuth server is not configured");
  }
  if (!constantTimeEqual(providedSecret, expectedSecret)) {
    fail("FORBIDDEN", "Unauthorized OAuth server request");
  }
};
