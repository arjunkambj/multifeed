import { Skeleton } from "@heroui/react";

export function ConnectionsRowsSkeleton() {
  return (
    <section className="divide-y divide-border/70">
      {Array.from({ length: 7 }, (_, index) => (
        <div className="grid gap-3 py-3.5 first:pt-0 last:pb-0 md:grid-cols-[220px_minmax(0,1fr)] md:items-center" key={index}>
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
