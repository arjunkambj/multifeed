import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/** Drop expired OAuth sessions (PKCE verifiers + interim encrypted tokens). */
crons.interval(
  "purge expired oauth sessions",
  { minutes: 10 },
  internal.oauth.sessions.purgeExpired,
);

/** Publish due scheduled posts every minute. */
crons.interval(
  "publish due posts",
  { minutes: 1 },
  internal.publishing.publishDuePosts,
);

/** Delete media uploads that were never confirmed (orphaned R2 objects). */
crons.interval(
  "purge stale media uploads",
  { hours: 1 },
  internal.media.r2.purgeStaleUploads,
);

export default crons;
