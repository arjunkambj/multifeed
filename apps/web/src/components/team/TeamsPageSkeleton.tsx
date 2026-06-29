import { Skeleton } from "@heroui/react";
import { TeamTableSkeleton } from "@/components/team/TeamTableSkeleton";

export function TeamsPageSkeleton() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-md rounded-xl" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {["members", "invites", "org"].map((item) => (
          <div className="rounded-2xl bg-surface-secondary p-5" key={item}>
            <Skeleton className="h-4 w-24 rounded-xl" />
            <Skeleton className="mt-3 h-8 w-20 rounded-xl" />
          </div>
        ))}
      </section>

      <TeamTableSkeleton />
    </div>
  );
}
