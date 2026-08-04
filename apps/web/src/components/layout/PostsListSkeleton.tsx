import { Skeleton } from "@heroui/react";

export function PostsListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="rounded-2xl border border-border bg-surface p-4" key={index}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex gap-2"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-4 w-32 rounded-lg" /></div>
              <Skeleton className="h-4 w-2/5 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-4/5 rounded-lg" />
              <div className="flex gap-2"><Skeleton className="h-6 w-24 rounded-full" /><Skeleton className="h-6 w-28 rounded-full" /></div>
            </div>
            <div className="flex gap-2"><Skeleton className="h-8 w-20 rounded-lg" /><Skeleton className="h-8 w-8 rounded-lg" /></div>
          </div>
        </div>
      ))}
    </div>
  );
}
