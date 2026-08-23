import { TeamTableSkeleton } from "@/components/team/TeamTableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
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
  | "teams"
  | "billing";

export function DashboardLoadingSkeleton({
  variant = "overview",
}: {
  variant?: DashboardLoadingVariant;
}) {
  if (variant === "settings") {
    return (
      <div
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 pt-8 lg:flex-row lg:gap-10"
        aria-busy="true"
        role="status"
      >
        <span className="sr-only">Loading page</span>
        <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-64">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  let content: React.ReactNode;
  let actions = 1;
  let actionClassName: string | undefined;

  switch (variant) {
    case "overview":
      actionClassName = "h-8 w-56 rounded-lg";
      content = (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton className="h-28" key={index} />
          ))}
        </div>
      );
      break;
    case "connections":
      actionClassName = "h-[4.75rem] w-72";
      content = <ConnectionsRowsSkeleton />;
      break;
    case "calendar":
      content = (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-40 rounded-lg" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-40 rounded-lg" />
              <Skeleton className="h-8 w-72 rounded-lg" />
            </div>
          </div>
          <CalendarGridSkeleton />
        </>
      );
      break;
    case "posts":
      actions = 2;
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
    case "teams":
      content = (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton className="h-28" key={index} />
            ))}
          </div>
          <TeamTableSkeleton />
        </>
      );
      break;
    case "billing":
      actions = 0;
      content = (
        <>
          <Skeleton className="h-24 w-full" />
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-8 w-40 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton className="h-80" key={index} />
            ))}
          </div>
        </>
      );
      break;
    case "inbox":
      actions = 0;
      content = (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton className="h-20 w-full" key={index} />
          ))}
        </div>
      );
      break;
  }

  return (
    <div className="flex flex-col gap-6" aria-busy="true" role="status">
      <span className="sr-only">Loading page</span>
      <PageHeaderSkeleton actionClassName={actionClassName} actions={actions} />
      {content}
    </div>
  );
}
