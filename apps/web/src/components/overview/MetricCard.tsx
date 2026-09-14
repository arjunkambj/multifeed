import { ArrowDown, ArrowUp, type HoneyIcon } from "@honeyicons/react";
import { CardTitle } from "@multifeed/ui/components/card";
import { Separator } from "@multifeed/ui/components/separator";
import { cn } from "@multifeed/ui/lib/utils";

type MetricCardProps = {
  title: string;
  value: string;
  icon: HoneyIcon;
  change?: number;
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  change,
}: MetricCardProps) {
  const trend = change == null ? null : Math.round(change * 10) / 10;
  const trendColor =
    trend == null || trend === 0
      ? "text-muted-foreground"
      : trend > 0
        ? "text-primary"
        : "text-destructive";

  return (
    <div
      className="group/card flex min-w-0 flex-col gap-2 overflow-hidden rounded-3xl bg-card py-4 text-sm text-card-foreground"
      data-slot="card"
      data-size="sm"
    >
      <div className="px-4" data-slot="card-header">
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <Icon size={18} className="shrink-0 text-muted-foreground" />
        </div>
      </div>
      <div
        className="mt-auto flex flex-col gap-2 px-4"
        data-slot="card-content"
      >
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
                  trend < 0 ? (
                    <ArrowDown size={13} />
                  ) : (
                    <ArrowUp size={13} />
                  )
                ) : null}
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
              <span className="text-muted-foreground">vs previous period</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
