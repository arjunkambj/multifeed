import assert from "node:assert/strict";
import test from "node:test";
import {
  effectiveCaption,
  interpretTikTokStatus,
  isResumablePublishError,
  missingPublishScopes,
  publishedFromAttempt,
  ResumablePublishError,
  linkedinAuthorUrn,
  tiktokChunkPlan,
  tiktokInteractionDisabled,
  tiktokPrivacyLevel,
  tweetIdFromUrl,
  youtubePrivacy,
} from "./convex/publishing/helpers.ts";

test("effectiveCaption prefers the override", () => {
  assert.equal(effectiveCaption("  hello  ", "  override  "), "override");
  assert.equal(effectiveCaption("hello", "   "), "hello");
});

test("tiktok privacy and chunking match Content Posting API rules", () => {
  assert.equal(tiktokPrivacyLevel("public"), "PUBLIC_TO_EVERYONE");
  assert.equal(tiktokPrivacyLevel("followers"), "SELF_ONLY");
  assert.deepEqual(tiktokChunkPlan(10 * 1024 * 1024), {
    chunkSize: 10 * 1024 * 1024,
    totalChunkCount: 1,
  });
  assert.deepEqual(tiktokChunkPlan(80 * 1024 * 1024), {
    chunkSize: 10 * 1024 * 1024,
    totalChunkCount: 8,
  });
  assert.equal(tiktokInteractionDisabled(undefined), false);
  assert.equal(tiktokInteractionDisabled(true), false);
  assert.equal(tiktokInteractionDisabled(false), true);
});

test("youtube privacy maps composer visibility", () => {
  assert.equal(youtubePrivacy("private"), "private");
  assert.equal(youtubePrivacy("unlisted"), "unlisted");
  assert.equal(youtubePrivacy("public"), "public");
});

test("tweet ids parse from x and twitter urls", () => {
  assert.equal(
    tweetIdFromUrl("https://x.com/multifeed/status/1234567890"),
    "1234567890",
  );
  assert.equal(
    tweetIdFromUrl("https://mobile.twitter.com/multifeed/status/99?s=20"),
    "99",
  );
  assert.equal(tweetIdFromUrl("not-a-url"), undefined);
});

test("linkedin author urns stay personal unless org metadata exists", () => {
  assert.equal(linkedinAuthorUrn("abc"), "urn:li:person:abc");
  assert.equal(
    linkedinAuthorUrn("abc", { organizationId: "123" }),
    "urn:li:organization:123",
  );
  assert.equal(
    linkedinAuthorUrn("abc", { authorUrn: "urn:li:person:xyz" }),
    "urn:li:person:xyz",
  );
});

test("tiktok status interpretation never treats inbox as published", () => {
  assert.equal(interpretTikTokStatus("PUBLISH_COMPLETE"), "complete");
  assert.equal(interpretTikTokStatus("SEND_TO_USER_INBOX"), "inbox");
  assert.equal(interpretTikTokStatus("PROCESSING_UPLOAD"), "pending");
});

test("publishedFromAttempt only resumes a real network create", () => {
  assert.equal(publishedFromAttempt(undefined), null);
  assert.equal(publishedFromAttempt({ kind: "x", mediaIds: ["1"] }), null);
  assert.deepEqual(publishedFromAttempt({
    platformPostId: "123",
    permalink: "https://x.com/i/web/status/123",
  }), {
    platformPostId: "123",
    permalink: "https://x.com/i/web/status/123",
  });
});

test("resumable publish errors stay in progress instead of failed", () => {
  assert.equal(isResumablePublishError(new ResumablePublishError("still processing")), true);
  assert.equal(isResumablePublishError(new Error("publish failed")), false);
});

test("old X and TikTok tokens are treated as missing publish scopes", () => {
  assert.deepEqual(missingPublishScopes("x", ["tweet.write"]), ["media.write"]);
  assert.deepEqual(missingPublishScopes("tiktok", ["video.publish"]), ["video.upload"]);
  assert.deepEqual(missingPublishScopes("x", []), ["tweet.write", "media.write"]);
  assert.deepEqual(missingPublishScopes("facebook", []), []);
});
