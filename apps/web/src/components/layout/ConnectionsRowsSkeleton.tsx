"use client";

import { Integration } from "@honeyicons/react";
import type { CSSProperties } from "react";
import { Card, CardHeader, CardTitle } from "@multifeed/ui/components/card";
import { Skeleton } from "@multifeed/ui/components/skeleton";
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
          <Card key={platform} variant="row">
            <CardHeader className="contents">
              <div className="contents">
                <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 sm:min-w-32">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-(--brand) text-(--brand-fg)"
                    style={
                      {
                        "--brand": meta.brand,
                        "--brand-fg":
                          meta.foreground ?? "var(--primary-foreground)",
                      } as CSSProperties
                    }
                  >
                    <meta.icon size={18} />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <CardTitle>
                      <h2 className="text-sm">{meta.label}</h2>
                    </CardTitle>
                  </div>
                </div>
                <Skeleton className="col-start-3 row-start-1 h-8 w-20" />
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </section>
  );
}
