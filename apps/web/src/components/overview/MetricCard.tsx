import { Icon } from "@iconify/react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type MetricCardProps = {
  title: string;
  value: string;
  icon: string;
  change?: number;
};

export function MetricCard({ title, value, icon, change }: MetricCardProps) {
  const trend = change == null ? null : Math.round(change * 10) / 10;
  const trendColor =
    trend == null || trend === 0
      ? "text-muted-foreground"
      : trend > 0
        ? "text-emerald-600"
        : "text-red-600";

  return (
    <Card className="bg-card py-3.5 [--card-spacing:--spacing(4)]">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-medium text-foreground">
            {title}
          </p>
          <Icon
            icon={icon}
            width={18}
            className="shrink-0 text-muted-foreground"
          />
        </div>
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
            <div className="flex items-center justify-between gap-2 text-xs">
              <span
                className={`flex items-center gap-1 font-medium ${trendColor}`}
              >
                {trend !== 0 ? (
                  <Icon
                    icon={
                      trend < 0
                        ? "hugeicons:arrow-down-02"
                        : "hugeicons:arrow-up-02"
                    }
                    width={13}
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
