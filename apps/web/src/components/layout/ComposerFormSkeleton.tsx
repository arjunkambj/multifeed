import { Skeleton } from "@/components/ui/skeleton";

export function ComposerFormSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
