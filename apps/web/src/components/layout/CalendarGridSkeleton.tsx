import { Skeleton } from "@heroui/react";

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
