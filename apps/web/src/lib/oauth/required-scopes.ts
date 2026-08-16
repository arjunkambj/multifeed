export const REQUIRED_PUBLISH_SCOPES: Record<string, string[]> = {
  x: ["tweet.write", "media.write"],
  tiktok: ["video.publish", "video.upload"],
  threads: ["threads_content_publish"],
  facebook: ["pages_manage_posts"],
  instagram: ["instagram_content_publish"],
  linkedin: ["w_member_social"],
  youtube: ["https://www.googleapis.com/auth/youtube.upload"],
};

export function missingPublishScopes(platform: string, scopes: string[]) {
  const required = REQUIRED_PUBLISH_SCOPES[platform] ?? [];
  if (scopes.length === 0) {
    return platform === "x" || platform === "tiktok" || platform === "threads"
      ? required
      : [];
  }
  return required.filter((scope) => !scopes.includes(scope));
}

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
