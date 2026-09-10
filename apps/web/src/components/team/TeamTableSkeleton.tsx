import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TeamTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border-4 border-card">
      <div className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr] bg-card">
        <div className="relative h-8 px-4 py-2 after:absolute after:inset-y-1 after:right-0 after:w-px after:bg-border">
          <Skeleton className="h-4 w-24 rounded-xl" />
        </div>
        <div className="relative h-8 px-4 py-2 after:absolute after:inset-y-1 after:right-0 after:w-px after:bg-border">
          <Skeleton className="h-4 w-20 rounded-xl" />
        </div>
        <div className="relative h-8 px-4 py-2 after:absolute after:inset-y-1 after:right-0 after:w-px after:bg-border">
          <Skeleton className="h-4 w-24 rounded-xl" />
        </div>
        <div className="h-8 px-4 py-2">
          <Skeleton className="h-4 w-16 rounded-xl" />
        </div>
      </div>
      {["first", "second", "third"].map((item, index) => (
        <div
          className={cn(
            "grid grid-cols-[1.5fr_1fr_1fr_0.7fr] items-center gap-4 px-4 py-3",
            index > 0 && "border-t border-border",
          )}
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
