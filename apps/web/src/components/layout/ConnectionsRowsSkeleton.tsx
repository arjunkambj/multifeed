import { Skeleton } from "@/components/ui/skeleton";

export function ConnectionsRowsSkeleton() {
  return (
    <section className="flex flex-col gap-4">
      {Array.from({ length: 7 }, (_, index) => (
        <div
          className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4"
          key={index}
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <div className="flex min-w-0 flex-col gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-32 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 shrink-0" />
        </div>
      ))}
    </section>
  );
}
