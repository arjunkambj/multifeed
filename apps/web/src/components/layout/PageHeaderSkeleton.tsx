import { Skeleton } from "@multifeed/ui/components/skeleton";
import { cn } from "@multifeed/ui/lib/utils";

export function PageHeaderSkeleton({
  actions = 1,
  wideAction = false,
}: {
  actions?: number;
  wideAction?: boolean;
}) {
  return (
    <header className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {actions > 0 && (
        <div className="flex min-w-0 flex-wrap gap-2">
          {Array.from({ length: actions }, (_, index) => (
            <Skeleton
              className={cn("h-8", wideAction ? "w-56" : "w-24")}
              key={index}
            />
          ))}
        </div>
      )}
    </header>
  );
}
