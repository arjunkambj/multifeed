import { ArrowDown02Icon, ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string;
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  change?: number;
};

export function MetricCard({ title, value, icon, change }: MetricCardProps) {
  const trend = change == null ? null : Math.round(change * 10) / 10;
  const trendColor =
    trend == null || trend === 0
      ? "text-muted-foreground"
      : trend > 0
        ? "text-primary"
        : "text-destructive";

  return (
    <Card size="sm" className="min-w-0 gap-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <HugeiconsIcon
            icon={icon}
            size={18}
            className="shrink-0 text-muted-foreground"
          />
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-2">
        <p className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-foreground">
          {value}
        </p>
        <div className="flex flex-col gap-1.5">
          <Separator />
          {trend == null ? (
            <p className="text-xs text-muted-foreground">
              Current workspace total
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
              <span
                className={cn(
                  "flex items-center gap-1 font-medium",
                  trendColor,
                )}
              >
                {trend !== 0 ? (
                  <HugeiconsIcon
                    icon={trend < 0 ? ArrowDown02Icon : ArrowUp02Icon}
                    size={13}
                  />
                ) : null}
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
              <span className="text-muted-foreground">vs previous period</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
