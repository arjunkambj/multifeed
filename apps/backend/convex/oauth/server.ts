const MIN_SECRET_LENGTH = 32;

const constantTimeEqual = (left: string, right: string) => {
  const length = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;

  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return mismatch === 0;
};

/** Proves a caller is the trusted Next.js server, not an authenticated browser. */
export const requireOAuthServer = (providedSecret: string) => {
  const expectedSecret = process.env.OAUTH_SERVER_SECRET;
  if (!expectedSecret || expectedSecret.length < MIN_SECRET_LENGTH) {
    throw new Error("OAUTH_SERVER_SECRET must be at least 32 characters");
  }
  if (!constantTimeEqual(providedSecret, expectedSecret)) {
    throw new Error("Unauthorized OAuth server request");
  }
};
