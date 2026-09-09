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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PLATFORM_META,
  platformBrand,
  platformLabel,
} from "@/lib/platform-meta";
import { cn } from "@/lib/utils";
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
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  publishing: {
    variant: "outline",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  published: {
    variant: "outline",
    className: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          className="min-w-0 max-w-full overflow-x-auto"
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
          <TabsList
            aria-label="Filter posts by status"
            className="bg-transparent p-0 [&_[data-slot=tabs-indicator]]:rounded-md [&_[data-slot=tabs-indicator]]:bg-muted"
          >
            {FILTERS.map((item) => (
              <TabsTrigger key={item.id} value={item.id} className="rounded-md">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Icon
            icon="hugeicons:search-01"
            width={16}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="rounded-lg border-0 bg-muted pr-9 pl-9 shadow-none"
            aria-label="Search posts"
            placeholder="Search posts or accounts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Clear search"
              className="absolute top-1/2 right-1.5 -translate-y-1/2"
              onClick={() => setSearch("")}
            >
              <Icon icon="hugeicons:cancel-01" width={14} />
            </Button>
          )}
        </div>
      </div>

      <div key={filter} className="tab-panel-transition">
        {posts === undefined ? (
          <PostsListSkeleton />
        ) : visiblePosts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
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
                {search
                  ? "Try another caption, account, or status."
                  : copy.empty}
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
          <div className="min-w-0">
            <div
              aria-hidden
              className="hidden grid-cols-[minmax(0,1fr)_11rem_8rem_9rem_2rem] items-center gap-5 px-5 py-3 text-xs font-medium text-muted-foreground xl:grid"
            >
              <span>Post</span>
              <span>Accounts</span>
              <span>Status</span>
              <span>Date</span>
              <span />
            </div>
            <ul className="flex flex-col gap-1">
              {visiblePosts.map((post) => (
                <li
                  key={post._id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-4 rounded-lg px-4 py-4 transition-colors hover:bg-muted/30 sm:px-5 xl:grid-cols-[minmax(0,1fr)_11rem_8rem_9rem_2rem]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground"
                      aria-hidden
                    >
                      <Icon
                        icon={
                          post.kind === "text"
                            ? "hugeicons:note-01"
                            : post.kind === "video"
                              ? "hugeicons:video-01"
                              : "hugeicons:image-01"
                        }
                        width={20}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {post.title || "Untitled post"}
                      </p>
                      <p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                        {post.body || "No caption"}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 flex min-w-0 flex-col items-start gap-2 xl:col-span-1">
                    {post.targets.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        No accounts selected
                      </span>
                    ) : (
                      post.targets.map((target) => (
                        <span
                          key={target.targetId}
                          className="flex max-w-full flex-col gap-1"
                        >
                          <span className="inline-flex min-w-0 items-center gap-2 text-xs">
                            <span
                              className="flex size-5 shrink-0 items-center justify-center rounded-md text-white"
                              style={{
                                backgroundColor: platformBrand(target.platform),
                              }}
                            >
                              <Icon
                                icon={
                                  PLATFORM_META[target.platform]?.icon ??
                                  "hugeicons:link-01"
                                }
                                width={11}
                                aria-hidden
                              />
                            </span>
                            <span className="sr-only">
                              {platformLabel(target.platform)}{" "}
                            </span>
                            <span className="truncate">
                              {target.username
                                ? `@${target.username}`
                                : platformLabel(target.platform)}
                            </span>
                            {target.hasCustomCaption && (
                              <Icon
                                icon="hugeicons:edit-02"
                                width={11}
                                aria-label="Custom caption"
                              />
                            )}
                          </span>
                          {target.failureMessage && (
                            <span className="break-words text-xs text-destructive">
                              {target.failureMessage}
                            </span>
                          )}
                        </span>
                      ))
                    )}
                    {post.status === "published" &&
                      post.targets.some(
                        (target) => target.platformPermalink,
                      ) && (
                        <div className="flex flex-wrap gap-2">
                          {post.targets.map((target) =>
                            target.platformPermalink ? (
                              <a
                                key={target.targetId}
                                href={target.platformPermalink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                              >
                                Open on {platformLabel(target.platform)}
                                <Icon
                                  icon="hugeicons:arrow-up-right-01"
                                  width={12}
                                  aria-hidden
                                />
                              </a>
                            ) : null,
                          )}
                        </div>
                      )}
                  </div>
                  <div>
                    <Badge
                      variant={
                        STATUS_BADGE[post.status]?.variant ?? "secondary"
                      }
                      className={cn(
                        "gap-1.5 rounded-md border-0 px-2 py-1 text-[11px] font-medium capitalize",
                        STATUS_BADGE[post.status]?.className,
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full bg-current",
                          post.status === "publishing" &&
                            "motion-safe:animate-pulse",
                        )}
                      />
                      {post.status === "published" ? "Posted" : post.status}
                    </Badge>
                  </div>
                  <div className="text-right text-xs xl:text-left">
                    <p className="font-medium">
                      {format(
                        new Date(post.scheduledFor ?? post.createdAt),
                        "MMM d, yyyy",
                      )}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {post.scheduledFor
                        ? format(new Date(post.scheduledFor), "h:mm a")
                        : "Created"}
                    </p>
                  </div>
                  <div className="col-start-2 row-start-1 justify-self-end xl:col-start-auto xl:row-start-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Actions for ${post.title || "untitled post"}`}
                          />
                        }
                      >
                        <Icon icon="hugeicons:more-horizontal" width={18} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 border-0"
                      >
                        {post.scheduledFor && post.status !== "draft" && (
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/calendar?highlight=${post._id}`)
                            }
                          >
                            <Icon icon="hugeicons:calendar-03" width={15} />
                            View in calendar
                          </DropdownMenuItem>
                        )}
                        {(post.status === "failed" ||
                          post.targets.some(
                            (target) => target.status === "failed",
                          )) && (
                          <DropdownMenuItem
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
                            {retrying === post._id
                              ? "Retrying…"
                              : "Retry delivery"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
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
                        </DropdownMenuItem>
                        {post.status !== "publishing" && (
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={deleting === post._id}
                            onClick={() => void onDelete(post._id)}
                          >
                            <Icon icon="hugeicons:delete-02" width={15} />
                            {deleting === post._id
                              ? "Deleting…"
                              : "Delete post"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
