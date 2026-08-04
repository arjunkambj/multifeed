import { ConvexError } from "convex/values";

export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "CONFLICT"
  | "FORBIDDEN"
  | "PLAN_LIMIT_REACHED"
  | "INTERNAL_ERROR";

/** Throw a structured error that the client can safely distinguish. */
export function fail(
  code: AppErrorCode,
  message: string,
  details?: Record<string, string | number | boolean>,
): never {
  throw new ConvexError({ code, message, ...details });
}
