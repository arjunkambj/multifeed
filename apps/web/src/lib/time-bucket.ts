const CACHE_TIME_BUCKET_MS = 60_000;

/** Stable within a minute so Convex can reuse time-sensitive query results. */
export const currentTimeBucket = () =>
  Math.floor(Date.now() / CACHE_TIME_BUCKET_MS) * CACHE_TIME_BUCKET_MS;
