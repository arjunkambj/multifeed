import { Skeleton } from "@/components/ui/skeleton";

export function ConnectionsRowsSkeleton() {
  return (
    <section className="flex flex-col gap-4">
      {Array.from({ length: 7 }, (_, index) => (
        <div
          className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)] md:items-center"
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
