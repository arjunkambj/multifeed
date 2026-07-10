/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as billing from "../billing.js";
import type * as crons from "../crons.js";
import type * as hexclave_auth from "../hexclave/auth.js";
import type * as http from "../http.js";
import type * as media_r2 from "../media/r2.js";
import type * as oauth_accounts from "../oauth/accounts.js";
import type * as oauth_crypto from "../oauth/crypto.js";
import type * as oauth_limits from "../oauth/limits.js";
import type * as oauth_server from "../oauth/server.js";
import type * as oauth_sessions from "../oauth/sessions.js";
import type * as posts from "../posts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  billing: typeof billing;
  crons: typeof crons;
  "hexclave/auth": typeof hexclave_auth;
  http: typeof http;
  "media/r2": typeof media_r2;
  "oauth/accounts": typeof oauth_accounts;
  "oauth/crypto": typeof oauth_crypto;
  "oauth/limits": typeof oauth_limits;
  "oauth/server": typeof oauth_server;
  "oauth/sessions": typeof oauth_sessions;
  posts: typeof posts;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  stack_auth: import("@hexclave/next/_generated/component.js").ComponentApi<"stack_auth">;
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
};
