/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as billing_auth from "../billing/auth.js";
import type * as billing_constants from "../billing/constants.js";
import type * as billing_dodoEvent from "../billing/dodoEvent.js";
import type * as billing_subscriptions from "../billing/subscriptions.js";
import type * as billing_types from "../billing/types.js";
import type * as billing_validators from "../billing/validators.js";
import type * as dodopayment from "../dodopayment.js";
import type * as hexclave_auth from "../hexclave/auth.js";
import type * as http from "../http.js";
import type * as webhooks_dodo from "../webhooks/dodo.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "billing/auth": typeof billing_auth;
  "billing/constants": typeof billing_constants;
  "billing/dodoEvent": typeof billing_dodoEvent;
  "billing/subscriptions": typeof billing_subscriptions;
  "billing/types": typeof billing_types;
  "billing/validators": typeof billing_validators;
  dodopayment: typeof dodopayment;
  "hexclave/auth": typeof hexclave_auth;
  http: typeof http;
  "webhooks/dodo": typeof webhooks_dodo;
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
};
