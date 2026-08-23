"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const SLOT_LIMIT = 12;

export function ConnectionUsageMeter({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const remaining = Math.max(limit - used, 0);
  const atLimit = used >= limit;
  const showSlots = limit > 0 && limit <= SLOT_LIMIT;
  const remainingLabel =
    remaining === 1 ? "1 account remaining" : `${remaining} accounts remaining`;

  return (
    <div className="w-full min-w-0 shrink-0 rounded-2xl bg-muted px-4 py-3 lg:w-72">
      <Progress
        value={Math.min(used, Math.max(limit, 1))}
        max={Math.max(limit, 1)}
        className={cn(
          "flex w-full flex-col gap-2.5 [&_[data-slot=progress-track]]:bg-background",
          showSlots && "[&_[data-slot=progress-track]]:hidden",
        )}
      >
        <div className="flex w-full items-baseline justify-between gap-3">
          <ProgressLabel className="font-normal text-muted-foreground">
            Connected accounts
          </ProgressLabel>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {used}
            <span className="font-medium text-muted-foreground">
              {" "}
              / {limit}
            </span>
          </p>
        </div>

        {showSlots ? (
          <div className="flex w-full gap-1" aria-hidden>
            {Array.from({ length: limit }, (_, index) => (
              <span
                className={cn(
                  "h-2 min-w-0 flex-1 rounded-full",
                  index < used ? "bg-primary" : "bg-background",
                )}
                key={index}
              />
            ))}
          </div>
        ) : null}
      </Progress>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {atLimit ? "Plan limit reached" : remainingLabel}
        </p>
        {atLimit ? (
          <Button
            nativeButton={false}
            render={<Link href="/billing" />}
            size="xs"
            variant="ghost"
          >
            Upgrade
          </Button>
        ) : null}
      </div>
    </div>
  );
}
