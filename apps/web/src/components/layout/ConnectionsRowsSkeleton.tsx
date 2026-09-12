"use client";

import { Integration } from "@honeyicons/react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CONNECTABLE_PLATFORMS, PLATFORM_META } from "@/lib/platform-meta";

export function ConnectionsRowsSkeleton() {
  return (
    <section
      aria-label="Social platforms"
      className="flex min-w-0 flex-1 flex-col gap-4 lg:order-first"
    >
      {CONNECTABLE_PLATFORMS.map((platform) => {
        const meta = PLATFORM_META[platform] ?? {
          label: platform,
          icon: Integration,
          brand: "var(--primary)",
        };
        return (
          <Card
            className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 rounded-xl px-3 py-2.5"
            key={platform}
            size="sm"
          >
            <CardHeader className="contents">
              <div className="contents">
                <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 sm:min-w-32">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: meta.brand,
                      color: meta.foreground ?? "#FFFFFF",
                    }}
                  >
                    <meta.icon size={18} />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <CardTitle className="text-sm">
                      <h2>{meta.label}</h2>
                    </CardTitle>
                  </div>
                </div>
                <Skeleton className="col-start-3 row-start-1 h-8 w-20 rounded-xl" />
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </section>
  );
}
