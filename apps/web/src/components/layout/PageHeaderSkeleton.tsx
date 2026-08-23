import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeaderSkeleton({
  actionClassName,
  actions = 1,
}: {
  actionClassName?: string;
  actions?: number;
}) {
  return (
    <header className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-36 rounded-xl" />
        <Skeleton className="h-4 w-80 max-w-full rounded-lg" />
      </div>
      {actions > 0 && (
        <div className="flex gap-2">
          {Array.from({ length: actions }, (_, index) => (
            <Skeleton
              className={cn("h-8 w-24 rounded-lg", actionClassName)}
              key={index}
            />
          ))}
        </div>
      )}
    </header>
  );
}
