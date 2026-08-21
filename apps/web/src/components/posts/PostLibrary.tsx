"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Icon } from "@iconify/react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { PostsListSkeleton } from "@/components/layout/PostsListSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { platformBrand, platformLabel } from "@/lib/platform-meta";
import {
  isPostLibraryFilter,
  type PostLibraryFilter,
} from "@/lib/post-filters";

const FILTERS: Array<{ id: PostLibraryFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Posted" },
  { id: "failed", label: "Failed" },
  { id: "draft", label: "Drafts" },
];

const PAGE_COPY: Record<
  PostLibraryFilter,
  { title: string; description: string; empty: string }
> = {
  all: {
    title: "All posts",
    description: "Every draft, scheduled post, result, and failed delivery.",
    empty: "Create your first post to start building a reusable history.",
  },
  scheduled: {
    title: "Scheduled",
    description: "Upcoming posts waiting to go live.",
    empty: "Choose a date in the composer and it will appear here.",
  },
  published: {
    title: "Posted",
    description: "Published posts and their account-level delivery links.",
    empty: "Published posts will collect here after delivery.",
  },
  failed: {
    title: "Failed",
    description: "Deliveries that did not go live and can be retried.",
    empty: "Failed deliveries will collect here.",
  },
  draft: {
    title: "Drafts",
    description: "Work in progress you can duplicate and finish later.",
    empty: "Save a post as a draft to continue it later.",
  },
};

const STATUS_BADGE: Record<
  string,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  draft: { variant: "secondary" },
  scheduled: {
    variant: "outline",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  },
  publishing: {
    variant: "outline",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  },
  published: {
    variant: "outline",
    className:
      "border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  },
  failed: { variant: "destructive" },
};

export function PostLibrary() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status");
  const filter = isPostLibraryFilter(rawStatus) ? rawStatus : "all";
  const router = useRouter();
  const removePost = useMutation(api.posts.remove);
  const retryFailed = useMutation(api.posts.retryFailed);
  const posts = useQuery(
    api.posts.list,
    filter === "all" ? { limit: 100 } : { status: filter, limit: 100 },
  );
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const copy = PAGE_COPY[filter];

  const visiblePosts = (() => {
    if (!posts) return [];
    const query = search.trim().toLowerCase();
    if (!query) return posts;
    return posts.filter((post) =>
      [
        post.title,
        post.body,
        post.status,
        ...post.targets.flatMap((target) => [
          target.username,
          platformLabel(target.platform),
        ]),
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  })();

  const onDelete = (postId: string) => {
    if (!window.confirm("Delete this post permanently?")) return;
    setDeleting(postId);
    void removePost({ postId: postId as Id<"posts"> })
      .then(() => toast.success("Post deleted."))
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Could not delete post",
        );
      })
      .finally(() => setDeleting(null));
  };

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageTitle
        title="All posts"
        description="Every draft, scheduled post, result, and failed delivery."
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/calendar")}
            >
              <Icon icon="hugeicons:calendar-03" width={16} />
              Calendar
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => router.push("/posts/new")}
            >
              <Icon icon="hugeicons:add-01" width={16} />
              New post
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filter}
          onValueChange={(key) => {
            const next = key as PostLibraryFilter;
            startTransition(() => {
              router.replace(
                next === "all" ? "/posts" : `/posts?status=${next}`,
                { scroll: false },
              );
            });
          }}
        >
          <TabsList aria-label="Filter posts by status">
            {FILTERS.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="w-full sm:w-64">
          <Input
            aria-label="Search posts"
            placeholder="Search posts or accounts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {posts === undefined ? (
        <PostsListSkeleton />
      ) : visiblePosts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon icon="hugeicons:note-01" width={24} />
          </span>
          <div>
            <p className="font-medium">
              {search
                ? "No matching posts"
                : filter === "all"
                  ? "No posts yet"
                  : `No ${copy.title.toLowerCase()} yet`}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {search ? "Try another caption, account, or status." : copy.empty}
            </p>
          </div>
          {!search && (
            <Button
              size="sm"
              variant="default"
              onClick={() => router.push("/posts/new")}
            >
              Create post
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visiblePosts.map((post) => (
            <Card
              key={post._id}
              className="border border-border bg-card shadow-none transition hover:border-primary/30"
            >
              <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        STATUS_BADGE[post.status]?.variant ?? "secondary"
                      }
                      className={STATUS_BADGE[post.status]?.className}
                    >
                      {post.status}
                    </Badge>
                    {post.scheduledFor && (
                      <span className="text-xs font-medium text-muted-foreground">
                        {format(
                          new Date(post.scheduledFor),
                          "EEE, MMM d · h:mm a",
                        )}
                      </span>
                    )}
                  </div>
                  {post.title && (
                    <p className="text-sm font-semibold">{post.title}</p>
                  )}
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {post.body || "No caption"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {post.targets.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        No accounts selected
                      </span>
                    ) : (
                      post.targets.map((target) => (
                        <span
                          key={target.targetId}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-[11px]"
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor: platformBrand(target.platform),
                            }}
                          />
                          {platformLabel(target.platform)}
                          {target.username ? ` · @${target.username}` : ""}
                          {target.hasCustomCaption && (
                            <Icon
                              icon="hugeicons:edit-02"
                              width={11}
                              aria-label="Custom caption"
                            />
                          )}
                          {target.failureMessage && (
                            <span className="text-red-600">
                              · {target.failureMessage}
                            </span>
                          )}
                        </span>
                      ))
                    )}
                  </div>
                  {post.status === "published" &&
                    post.targets.some((target) => target.platformPermalink) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.targets.reduce<React.ReactNode[]>(
                          (acc, target) => {
                            if (target.platformPermalink) {
                              acc.push(
                                <a
                                  key={target.targetId}
                                  href={target.platformPermalink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-medium text-primary hover:underline"
                                >
                                  Open on {platformLabel(target.platform)}
                                </a>,
                              );
                            }
                            return acc;
                          },
                          [],
                        )}
                      </div>
                    )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {post.scheduledFor && post.status !== "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/calendar?highlight=${post._id}`)
                      }
                    >
                      <Icon icon="hugeicons:calendar-03" width={15} />
                      View
                    </Button>
                  )}
                  {(post.status === "failed" ||
                    post.targets.some(
                      (target) => target.status === "failed",
                    )) && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={retrying === post._id}
                      onClick={async () => {
                        setRetrying(post._id);
                        try {
                          const result = await retryFailed({
                            postId: post._id,
                          });
                          toast.success(
                            result.retried === 1
                              ? "Retrying 1 failed delivery."
                              : `Retrying ${result.retried} failed deliveries.`,
                          );
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Could not retry this post",
                          );
                        } finally {
                          setRetrying(null);
                        }
                      }}
                    >
                      <Icon icon="hugeicons:refresh" width={15} />
                      Retry
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(
                        post.status === "draft"
                          ? `/posts/new?edit=${post._id}`
                          : `/posts/new?from=${post._id}`,
                      )
                    }
                  >
                    <Icon
                      icon={
                        post.status === "draft"
                          ? "hugeicons:edit-02"
                          : "hugeicons:copy-01"
                      }
                      width={15}
                    />
                    {post.status === "draft" ? "Continue" : "Duplicate"}
                  </Button>
                  {post.status !== "publishing" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={deleting === post._id}
                      onClick={() => void onDelete(post._id)}
                    >
                      <Icon icon="hugeicons:delete-02" width={15} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
