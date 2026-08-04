import { Skeleton } from "@heroui/react";

export function ComposerFormSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6"><Skeleton className="h-36 w-full rounded-2xl" /><Skeleton className="h-48 w-full rounded-2xl" /><Skeleton className="h-28 w-full rounded-2xl" /></div>
      <div className="space-y-4"><Skeleton className="h-44 w-full rounded-2xl" /><Skeleton className="h-36 w-full rounded-2xl" /><Skeleton className="h-10 w-full rounded-xl" /></div>
    </div>
  );
}
