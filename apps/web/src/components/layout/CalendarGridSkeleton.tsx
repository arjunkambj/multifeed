import { Skeleton } from "@/components/ui/skeleton";

export function CalendarGridSkeleton() {
  return (
    <div className="grid min-h-[640px] grid-cols-7 gap-1">
      {Array.from({ length: 35 }, (_, index) => (
        <Skeleton className="min-h-24 w-full rounded-lg" key={index} />
      ))}
    </div>
  );
}
