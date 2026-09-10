"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Icon } from "@iconify/react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { PostsListSkeleton } from "@/components/layout/PostsListSkeleton";
import { PostsTable } from "@/components/posts/PostsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { platformLabel } from "@/lib/platform-meta";
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

const EMPTY_COPY: Record<PostLibraryFilter, string> = {
  all: "No posts yet",
  scheduled: "No scheduled posts yet",
  published: "No published posts yet",
  failed: "No failed posts yet",
  draft: "No drafts yet",
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
  const emptyMessage = search.trim() ? "No matching posts" : EMPTY_COPY[filter];

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

  const onDelete = (postId: Id<"posts">) => {
    if (!window.confirm("Delete this post permanently?")) return;
    setDeleting(postId);
    void removePost({ postId })
      .then(() => toast.success("Post deleted."))
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Could not delete post",
        );
      })
      .finally(() => setDeleting(null));
  };

  const onRetry = (postId: Id<"posts">) => {
    setRetrying(postId);
    void retryFailed({ postId })
      .then((result) => {
        toast.success(
          result.retried === 1
            ? "Retrying 1 failed delivery."
            : `Retrying ${result.retried} failed deliveries.`,
        );
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Could not retry this post",
        );
      })
      .finally(() => setRetrying(null));
  };

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageTitle
        title="All posts"
        description="Every draft, scheduled post, result, and failed delivery."
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/calendar")}>
              <Icon icon="hugeicons:calendar-03" width={16} />
              Calendar
            </Button>
            <Button variant="default" onClick={() => router.push("/posts/new")}>
              <Icon icon="hugeicons:add-01" width={16} />
              New post
            </Button>
          </>
        }
      />

      <Tabs
        className="gap-6"
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList aria-label="Filter posts by status">
            {FILTERS.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="relative w-full sm:w-64">
            <Icon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              icon="hugeicons:search-01"
              width={16}
            />
            <Input
              aria-label="Search posts"
              className="border-0 bg-muted pr-9 pl-9 shadow-none"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search posts or accounts"
              value={search}
            />
            {search && (
              <Button
                aria-label="Clear search"
                className="absolute top-1/2 right-1.5 -translate-y-1/2"
                onClick={() => setSearch("")}
                size="icon-xs"
                variant="ghost"
              >
                <Icon icon="hugeicons:cancel-01" width={14} />
              </Button>
            )}
          </div>
        </div>

        <TabsContent key={filter} value={filter}>
          {posts === undefined ? (
            <PostsListSkeleton />
          ) : (
            <PostsTable
              deletingId={deleting}
              emptyAction={
                search.trim() ? undefined : (
                  <Button
                    onClick={() => router.push("/posts/new")}
                    variant="default"
                  >
                    Create post
                  </Button>
                )
              }
              emptyMessage={emptyMessage}
              onDelete={onDelete}
              onEdit={(postId, isDraft) =>
                router.push(
                  isDraft
                    ? `/posts/new?edit=${postId}`
                    : `/posts/new?from=${postId}`,
                )
              }
              onRetry={onRetry}
              onViewCalendar={(postId) =>
                router.push(`/calendar?highlight=${postId}`)
              }
              posts={visiblePosts}
              retryingId={retrying}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
