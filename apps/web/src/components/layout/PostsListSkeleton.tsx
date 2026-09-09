import { Skeleton } from "@/components/ui/skeleton";

export function PostsListSkeleton() {
  return (
    <div className="min-w-0" role="status" aria-label="Loading posts">
      <div className="hidden h-10 xl:block" />
      <div className="flex flex-col gap-1">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 px-5 py-4 xl:grid-cols-[minmax(0,1fr)_11rem_8rem_9rem_2rem]"
            key={index}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-11 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/5 rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
            </div>
            <Skeleton className="col-span-2 h-5 w-28 rounded-md xl:col-span-1" />
            <Skeleton className="h-6 w-20 rounded-md" />
            <div className="flex flex-col items-end gap-2 xl:items-start">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-3 w-14 rounded-md" />
            </div>
            <Skeleton className="col-start-2 row-start-1 size-7 justify-self-end rounded-md xl:col-start-auto xl:row-start-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
