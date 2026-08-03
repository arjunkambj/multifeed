import { Skeleton } from "@heroui/react";

type DashboardLoadingVariant =
  | "overview"
  | "connections"
  | "calendar"
  | "inbox"
  | "posts"
  | "composer"
  | "settings"
  | "teams";

function PageHeaderSkeleton({ actions = 1 }: { actions?: number }) {
  return (
    <header className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-36 rounded-xl" />
        <Skeleton className="h-4 w-80 max-w-full rounded-lg" />
      </div>
      {actions > 0 && (
        <div className="flex gap-2">
          {Array.from({ length: actions }, (_, index) => (
            <Skeleton className="h-8 w-24 rounded-lg" key={index} />
          ))}
        </div>
      )}
    </header>
  );
}

export function ConnectionsRowsSkeleton() {
  return (
    <section className="divide-y divide-border/70">
      {Array.from({ length: 7 }, (_, index) => (
        <div
          className="grid gap-3 py-3.5 first:pt-0 last:pb-0 md:grid-cols-[220px_minmax(0,1fr)] md:items-center"
          key={index}
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-44 rounded-lg" />
        </div>
      ))}
    </section>
  );
}

export function PostsListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="rounded-2xl border border-border bg-surface p-4" key={index}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-32 rounded-lg" />
              </div>
              <Skeleton className="h-4 w-2/5 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-4/5 rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalendarGridSkeleton() {
  return (
    <div className="grid min-h-[640px] grid-cols-7 overflow-hidden rounded-xl border border-border">
      {Array.from({ length: 35 }, (_, index) => (
        <div className="min-h-24 border-b border-r border-border/70 p-2" key={index}>
          {index < 7 && <Skeleton className="h-3 w-8 rounded-md" />}
          {index % 5 === 0 && <Skeleton className="mt-5 h-5 w-full rounded-md" />}
          {index % 9 === 0 && <Skeleton className="mt-2 h-5 w-4/5 rounded-md" />}
        </div>
      ))}
    </div>
  );
}

export function ComposerFormSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

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
