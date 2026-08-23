import { Skeleton } from "@/components/ui/skeleton";

export function TeamTableSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr] gap-4 px-1 py-2">
        <Skeleton className="h-4 w-24 rounded-xl" />
        <Skeleton className="h-4 w-20 rounded-xl" />
        <Skeleton className="h-4 w-24 rounded-xl" />
        <Skeleton className="h-4 w-16 rounded-xl" />
      </div>
      {["first", "second", "third"].map((item) => (
        <div
          className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr] items-center gap-4 px-1 py-3"
          key={item}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32 rounded-xl" />
              <Skeleton className="h-3 w-20 rounded-xl" />
            </div>
          </div>
          <Skeleton className="h-4 w-40 rounded-xl" />
          <Skeleton className="h-4 w-28 rounded-xl" />
          <Skeleton className="h-4 w-16 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
