"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Chip, Input, Spinner, Tabs } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { format } from "date-fns";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { platformBrand, platformLabel } from "@/lib/platform-meta";

export type PostLibraryFilter = "all" | "scheduled" | "published" | "draft";

const FILTERS: Array<{ id: PostLibraryFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Posted" },
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
  draft: {
    title: "Drafts",
    description: "Work in progress you can duplicate and finish later.",
    empty: "Save a post as a draft to continue it later.",
  },
};

const STATUS_TONE: Record<
  string,
  "default" | "success" | "warning" | "danger"
> = {
  draft: "default",
  scheduled: "warning",
  publishing: "warning",
  published: "success",
  failed: "danger",
};

export function PostLibrary() {
  const router = useRouter();
  const removePost = useMutation(api.posts.remove);
  const [filter, setFilter] = useState<PostLibraryFilter>("all");
  const posts = useQuery(
    api.posts.list,
    filter === "all" ? { limit: 100 } : { status: filter, limit: 100 },
  );
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const copy = PAGE_COPY[filter];

  const visiblePosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!posts) return [];
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
  }, [posts, search]);

  const onDelete = async (postId: string) => {
    if (!window.confirm("Delete this post permanently?")) return;
    setDeleting(postId);
    try {
      await removePost({ postId: postId as Id<"posts"> });
    } finally {
      setDeleting(null);
    }
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
              variant="tertiary"
              onPress={() => router.push("/calendar")}
            >
              <Icon icon="hugeicons:calendar-03" width={16} />
              Calendar
            </Button>
            <Button
              size="sm"
              variant="primary"
              onPress={() => router.push("/posts/new")}
            >
              <Icon icon="hugeicons:add-01" width={16} />
              New post
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          selectedKey={filter}
          onSelectionChange={(key) => setFilter(key as PostLibraryFilter)}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Filter posts by status">
              {FILTERS.map((item) => (
                <Tabs.Tab key={item.id} id={item.id}>
                  {item.label}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
        <div className="w-full sm:w-64">
          <Input
            aria-label="Search posts"
            fullWidth
            placeholder="Search posts or accounts"
            variant="secondary"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {posts === undefined ? (
        <div className="flex min-h-48 items-center justify-center">
          <Spinner />
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
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
            <p className="mt-1 max-w-sm text-sm text-muted">
              {search ? "Try another caption, account, or status." : copy.empty}
            </p>
          </div>
          {!search && (
            <Button
              size="sm"
              variant="primary"
              onPress={() => router.push("/posts/new")}
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
              className="border border-border bg-surface shadow-none transition hover:border-accent/30"
            >
              <Card.Content className="flex flex-col gap-4 py-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Chip
                      size="sm"
                      color={STATUS_TONE[post.status] ?? "default"}
                      variant="soft"
                    >
                      {post.status}
                    </Chip>
                    {post.scheduledFor && (
                      <span className="text-xs font-medium text-muted">
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
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                    {post.body || "No caption"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {post.targets.length === 0 ? (
                      <span className="text-xs text-muted">
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
                          {target.bodyOverride && (
                            <Icon
                              icon="hugeicons:edit-02"
                              width={11}
                              aria-label="Custom caption"
                            />
                          )}
                        </span>
                      ))
                    )}
                  </div>
                  {post.status === "published" &&
                    post.targets.some((target) => target.platformPermalink) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.targets
                          .filter((target) => target.platformPermalink)
                          .map((target) => (
                            <a
                              key={target.targetId}
                              href={target.platformPermalink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-accent hover:underline"
                            >
                              Open on {platformLabel(target.platform)}
                            </a>
                          ))}
                      </div>
                    )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {post.scheduledFor && post.status !== "draft" && (
                    <Button
                      size="sm"
                      variant="tertiary"
                      onPress={() =>
                        router.push(`/calendar?highlight=${post._id}`)
                      }
                    >
                      <Icon icon="hugeicons:calendar-03" width={15} />
                      View
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="tertiary"
                    onPress={() =>
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
                  <Button
                    size="sm"
                    variant="tertiary"
                    isPending={deleting === post._id}
                    onPress={() => void onDelete(post._id)}
                  >
                    <Icon icon="hugeicons:delete-02" width={15} />
                  </Button>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
