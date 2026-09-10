import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGridSkeleton() {
  return (
    <div className="flex min-h-[640px] flex-col">
      <div className="grid grid-cols-7 bg-card">
        {WEEKDAYS.map((day) => (
          <div
            className="relative py-2 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase after:absolute after:inset-y-1.5 after:right-0 after:w-px after:bg-border last:after:hidden"
            key={day}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7">
        {Array.from({ length: 35 }, (_, index) => (
          <div
            className={cn(
              "border-border p-2",
              index % 7 !== 6 && "border-r",
              index < 28 && "border-b",
            )}
            key={index}
          >
            <Skeleton className="size-5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
