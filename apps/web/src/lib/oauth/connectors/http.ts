const PROVIDER_TIMEOUT_MS = 15_000;

export const oauthFetch = (
  input: string | URL | Request,
  init: RequestInit = {},
) =>
  fetch(input, {
    ...init,
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
