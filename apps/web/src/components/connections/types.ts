export type { OAuthPlatform } from "@/lib/platform-meta";

export type AccountStatus =
  | "active"
  | "expired"
  | "revoked"
  | "error"
  | "pending_selection";
