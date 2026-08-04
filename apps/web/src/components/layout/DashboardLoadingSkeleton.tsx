import { Skeleton } from "@heroui/react";
import { CalendarGridSkeleton } from "./CalendarGridSkeleton";
import { ComposerFormSkeleton } from "./ComposerFormSkeleton";
import { ConnectionsRowsSkeleton } from "./ConnectionsRowsSkeleton";
import { PageHeaderSkeleton } from "./PageHeaderSkeleton";
import { PostsListSkeleton } from "./PostsListSkeleton";

type DashboardLoadingVariant =
  | "overview"
  | "connections"
  | "calendar"
  | "inbox"
  | "posts"
  | "composer"
  | "settings"
  | "teams";

export function DashboardLoadingSkeleton({
  variant = "overview",
}: {
  variant?: DashboardLoadingVariant;
}) {
  let content: React.ReactNode;

  switch (variant) {
    case "overview":
      content = (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton className="h-28 rounded-2xl" key={index} />
          ))}
        </div>
      );
      break;
    case "connections":
      content = <ConnectionsRowsSkeleton />;
      break;
    case "calendar":
      content = (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-28 rounded-lg" />
              <Skeleton className="h-8 w-36 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-72 rounded-lg" />
          </div>
          <CalendarGridSkeleton />
        </>
      );
      break;
    case "posts":
      content = (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-9 w-72 rounded-lg" />
            <Skeleton className="h-9 w-64 rounded-lg" />
          </div>
          <PostsListSkeleton />
        </>
      );
      break;
    case "composer":
      content = <ComposerFormSkeleton />;
      break;
    case "settings":
      content = (
        <>
          <Skeleton className="h-10 w-96 max-w-full rounded-lg" />
          <div className="max-w-xl space-y-5 pt-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </>
      );
      break;
    case "teams":
      content = (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton className="h-28 rounded-2xl" key={index} />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </>
      );
      break;
    case "inbox":
      content = <Skeleton className="h-48 w-full rounded-2xl" />;
      break;
  }

  return (
    <div className="flex flex-col gap-6" aria-busy="true" role="status">
      <span className="sr-only">Loading page</span>
      <PageHeaderSkeleton actions={variant === "inbox" ? 0 : 1} />
      {content}
    </div>
  );
}
