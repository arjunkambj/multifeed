import { Skeleton } from "@/components/ui/skeleton";

export function ComposerFormSkeleton() {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-8">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-28" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton className="h-11 w-36 rounded-xl" key={index} />
            ))}
          </div>
        </div>
        <Skeleton className="h-px w-full rounded-none" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-full rounded-xl" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="min-h-32 w-full rounded-xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-36 rounded-xl" />
          <Skeleton className="h-8 w-32 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-48 rounded-xl" />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row-reverse">
          <Skeleton className="h-8 w-full rounded-xl sm:w-40" />
          <Skeleton className="h-8 w-full rounded-xl sm:mr-auto sm:w-24" />
        </div>
      </div>
      <aside className="min-w-0 rounded-2xl bg-muted/30 p-4">
        <Skeleton className="mb-4 h-4 w-24" />
        <Skeleton className="h-72 w-full" />
      </aside>
    </div>
  );
}
