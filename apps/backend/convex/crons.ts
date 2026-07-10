import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/** Drop expired OAuth sessions (PKCE verifiers + interim encrypted tokens). */
crons.interval(
  "purge expired oauth sessions",
  { minutes: 15 },
  internal.oauth.sessions.purgeExpired,
);

export default crons;
