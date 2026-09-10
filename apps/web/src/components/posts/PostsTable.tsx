"use client";

import { api } from "@convex/_generated/api";
import { Icon } from "@iconify/react";
import type { FunctionReturnType } from "convex/server";
import { format } from "date-fns";
import type { ReactNode } from "react";
import { POST_FORMATS } from "@/components/posts/post-composer-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PLATFORM_META,
  platformBrand,
  platformForeground,
  platformLabel,
} from "@/lib/platform-meta";
import { cn } from "@/lib/utils";

export type PostListItem = FunctionReturnType<typeof api.posts.list>[number];

const tableHeadClassName =
  "relative h-8 bg-card px-4 py-2 after:absolute after:inset-y-1 after:right-0 after:w-px after:bg-border";

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
    className: "border-0 bg-primary/10 text-primary",
  },
  publishing: { variant: "outline" },
  published: { variant: "secondary" },
  failed: { variant: "destructive" },
};

export function PostsTableHead() {
  return (
    <TableHeader className="bg-card [&_tr]:border-b-0">
      <TableRow className="border-b-0 hover:bg-card">
        <TableHead className={cn(tableHeadClassName, "w-[36%]")}>
          Post
        </TableHead>
        <TableHead className={cn(tableHeadClassName, "w-[20%]")}>
          Accounts
        </TableHead>
        <TableHead className={cn(tableHeadClassName, "w-[12%]")}>
          Open
        </TableHead>
        <TableHead className={cn(tableHeadClassName, "w-[12%]")}>
          Status
        </TableHead>
        <TableHead className={cn(tableHeadClassName, "w-[14%]")}>
          Date
        </TableHead>
        <TableHead className="h-8 w-14 bg-card px-4 py-2">
          <span className="sr-only">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

export function PostsTable({
  deletingId,
  emptyAction,
  emptyMessage,
  onDelete,
  onEdit,
  onRetry,
  onViewCalendar,
  posts,
  retryingId,
}: {
  deletingId: string | null;
  emptyAction?: ReactNode;
  emptyMessage: string;
  onDelete: (postId: PostListItem["_id"]) => void;
  onEdit: (postId: PostListItem["_id"], isDraft: boolean) => void;
  onRetry: (postId: PostListItem["_id"]) => void;
  onViewCalendar: (postId: PostListItem["_id"]) => void;
  posts: PostListItem[];
  retryingId: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border-4 border-card">
      <Table className="min-w-[880px] table-fixed">
        <PostsTableHead />
        <TableBody>
          {posts.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                className="px-4 py-10 text-center whitespace-normal text-muted-foreground"
                colSpan={6}
              >
                <div className="flex flex-col items-center gap-3">
                  <p>{emptyMessage}</p>
                  {emptyAction}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            posts.map((post) => (
              <PostTableRow
                deleting={deletingId === post._id}
                key={post._id}
                onDelete={() => onDelete(post._id)}
                onEdit={() => onEdit(post._id, post.status === "draft")}
                onRetry={() => onRetry(post._id)}
                onViewCalendar={() => onViewCalendar(post._id)}
                post={post}
                retrying={retryingId === post._id}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function PostTableRow({
  deleting,
  onDelete,
  onEdit,
  onRetry,
  onViewCalendar,
  post,
  retrying,
}: {
  deleting: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onRetry: () => void;
  onViewCalendar: () => void;
  post: PostListItem;
  retrying: boolean;
}) {
  const canRetry =
    post.status === "failed" ||
    post.targets.some((target) => target.status === "failed");
  const permalinks = post.targets.filter((target) => target.platformPermalink);

  return (
    <TableRow className="border-border">
      <TableCell className="px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
          >
            <Icon
              icon={
                POST_FORMATS.find((format) => format.id === post.kind)?.icon ??
                "hugeicons:note-01"
              }
              width={18}
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {post.title || "Untitled post"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {post.body || "No caption"}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 whitespace-normal">
        {post.targets.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            No accounts selected
          </span>
        ) : (
          <div className="flex flex-col gap-2">
            {post.targets.map((target) => (
              <span
                className="flex max-w-full flex-col gap-1"
                key={target.targetId}
              >
                <span className="inline-flex min-w-0 items-center gap-2 text-sm">
                  <span
                    className="flex size-5 shrink-0 items-center justify-center rounded-md"
                    style={{
                      backgroundColor: platformBrand(target.platform),
                      color: platformForeground(target.platform),
                    }}
                  >
                    <Icon
                      aria-hidden
                      icon={
                        PLATFORM_META[target.platform]?.icon ??
                        "hugeicons:link-01"
                      }
                      width={11}
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
                      aria-label="Custom caption"
                      icon="hugeicons:edit-02"
                      width={11}
                    />
                  )}
                </span>
                {target.failureMessage && (
                  <span className="break-words text-xs text-destructive">
                    {target.failureMessage}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </TableCell>
      <TableCell className="px-4">
        <OpenPostButton permalinks={permalinks} />
      </TableCell>
      <TableCell className="px-4">
        <Badge
          className={cn("capitalize", STATUS_BADGE[post.status]?.className)}
          variant={STATUS_BADGE[post.status]?.variant ?? "secondary"}
        >
          <span
            className={cn(
              "size-1.5 rounded-full bg-current",
              post.status === "publishing" && "motion-safe:animate-pulse",
            )}
          />
          {post.status === "published" ? "Posted" : post.status}
        </Badge>
      </TableCell>
      <TableCell className="px-4">
        <p className="text-sm font-medium text-foreground">
          {format(new Date(post.scheduledFor ?? post.createdAt), "MMM d, yyyy")}
        </p>
        <p className="text-xs text-muted-foreground">
          {post.scheduledFor
            ? format(new Date(post.scheduledFor), "h:mm a")
            : "Created"}
        </p>
      </TableCell>
      <TableCell className="px-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={`Actions for ${post.title || "untitled post"}`}
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            <Icon icon="hugeicons:more-horizontal" width={18} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuGroup>
              {post.scheduledFor && post.status !== "draft" && (
                <DropdownMenuItem onClick={onViewCalendar}>
                  <Icon icon="hugeicons:calendar-03" width={15} />
                  View in calendar
                </DropdownMenuItem>
              )}
              {canRetry && (
                <DropdownMenuItem disabled={retrying} onClick={onRetry}>
                  <Icon icon="hugeicons:refresh" width={15} />
                  {retrying ? "Retrying…" : "Retry delivery"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onEdit}>
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
                  disabled={deleting}
                  onClick={onDelete}
                  variant="destructive"
                >
                  <Icon icon="hugeicons:delete-02" width={15} />
                  {deleting ? "Deleting…" : "Delete post"}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function OpenPostButton({
  permalinks,
}: {
  permalinks: PostListItem["targets"];
}) {
  if (permalinks.length === 0) return null;

  if (permalinks.length === 1) {
    const target = permalinks[0]!;
    return (
      <Button
        nativeButton={false}
        render={
          <a href={target.platformPermalink} rel="noreferrer" target="_blank" />
        }
        size="xs"
        variant="outline"
      >
        Open
        <Icon data-icon="inline-end" icon="hugeicons:arrow-up-right-01" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="xs" variant="outline" />}>
        Open
        <Icon data-icon="inline-end" icon="hugeicons:arrow-up-right-01" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuGroup>
          {permalinks.map((target) => (
            <DropdownMenuItem
              key={target.targetId}
              nativeButton={false}
              render={
                <a
                  href={target.platformPermalink}
                  rel="noreferrer"
                  target="_blank"
                />
              }
            >
              Open on {platformLabel(target.platform)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
