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

export default crons;
