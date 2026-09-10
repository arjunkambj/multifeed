import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col items-center gap-3" aria-busy="true">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex w-full flex-col gap-4">
        <Skeleton className="h-9 w-full rounded-2xl" />
        <Skeleton className="h-9 w-full rounded-2xl" />
      </div>
      <div className="flex w-full items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground font-medium">OR</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <Skeleton className="h-10 w-full rounded-2xl" />
    </div>
  );
}
