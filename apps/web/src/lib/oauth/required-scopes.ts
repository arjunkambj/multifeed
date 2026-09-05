import { missingPublishScopes } from "@convex/publishing/helpers";

export function accountNeedsReconnect(account: {
  status: string;
  platform: string;
  scopes: string[];
}) {
  return (
    account.status !== "active" ||
    missingPublishScopes(account.platform, account.scopes).length > 0
  );
}
