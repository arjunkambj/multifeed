"use client";

import { Button, Card, Chip, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import {
  PLATFORM_META,
  platformBrand,
  platformLabel,
} from "@/lib/platform-meta";

export function ScheduledPostsList() {
  const router = useRouter();
  const posts = useQuery(api.posts.listScheduled, { limit: 50 });
  const removePost = useMutation(api.posts.remove);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <DashboardPageTitle title="Scheduled" />
          <p className="mt-1 text-sm text-muted">
            Upcoming posts waiting to go live.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
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
        </div>
      </div>

      {posts === undefined ? (
        <div className="flex min-h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : posts.length === 0 ? (
        <Card className="border border-dashed border-border bg-surface shadow-none">
          <Card.Content className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Icon icon="hugeicons:calendar-check-in-01" width={24} />
            </span>
            <div>
              <p className="font-medium">Nothing scheduled yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Create a post and pick a time — it will show up here and on the
                calendar.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onPress={() => router.push("/posts/new")}
            >
              Create post
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {posts
            .slice()
            .sort(
              (a, b) => (a.scheduledFor ?? 0) - (b.scheduledFor ?? 0),
            )
            .map((post) => (
              <Card
                key={post._id}
                className="border border-border bg-surface shadow-none transition hover:border-accent/30"
              >
                <Card.Content className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Chip size="sm" color="warning" variant="soft">
                        scheduled
                      </Chip>
                      {post.scheduledFor && (
                        <span className="text-xs font-medium text-foreground">
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
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {post.body || "No caption"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {post.targets.map((t) => (
                        <span
                          key={t.targetId}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px]"
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor: platformBrand(t.platform),
                            }}
                          />
                          {platformLabel(t.platform)}
                          {t.username ? ` · @${t.username}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      size="sm"
                      variant="tertiary"
                      onPress={() =>
                        router.push(`/calendar?highlight=${post._id}`)
                      }
                    >
                      <Icon
                        icon={
                          PLATFORM_META[post.targets[0]?.platform ?? ""]
                            ?.icon ?? "hugeicons:calendar-03"
                        }
                        width={16}
                      />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      onPress={() =>
                        void removePost({
                          postId: post._id as Id<"posts">,
                        })
                      }
                    >
                      <Icon icon="hugeicons:delete-02" width={16} />
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
