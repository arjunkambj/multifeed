"use client";

import { api } from "@convex/_generated/api";
import { Icon } from "@iconify/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useState } from "react";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { OverviewDateRangePicker } from "@/components/overview/OverviewDateRangePicker";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type CalendarDateRange,
  calendarDateRangeToMilliseconds,
  type DateRangePreset,
  getPresetRange,
} from "@/lib/date-ranges";

type MetricCardProps = {
  title: string;
  value: string;
  icon: string;
  change?: number;
};

const numberFormatter = new Intl.NumberFormat("en-US");
const formatNumber = (n: number) => numberFormatter.format(n);

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function MetricCard({ title, value, icon, change }: MetricCardProps) {
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

function MetricsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
}

export function OverviewDashboard() {
  const [range, setRange] = useState(() => getPresetRange("today"));
  const [preset, setPreset] = useState<DateRangePreset | null>("today");
  const queryRange = calendarDateRangeToMilliseconds(range);
  const metrics = useQuery(api.posts.overviewMetrics, queryRange);

  const updateRange = (
    nextRange: CalendarDateRange,
    nextPreset: DateRangePreset | null,
  ) => {
    setRange(nextRange);
    setPreset(nextPreset);
  };

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageTitle
        title="Overview"
        description="Your publishing workspace at a glance."
        actions={
          <OverviewDateRangePicker
            value={range}
            preset={preset}
            onChange={updateRange}
          />
        }
      />

      {metrics === undefined ? (
        <MetricsSkeleton />
      ) : (
        <>
          {metrics.truncated && (
            <p className="mb-4 text-sm text-amber-500">
              This range contains more data than the dashboard can summarize.
              Narrow the date range for complete metrics.
            </p>
          )}
          <section
            aria-busy={metrics === undefined}
            aria-label="Publishing KPIs"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
          >
            <MetricCard
              title="Scheduled posts"
              value={formatNumber(metrics.scheduledPosts)}
              icon="hugeicons:calendar-03"
              change={percentageChange(
                metrics.scheduledPosts,
                metrics.previousScheduledPosts,
              )}
            />
            <MetricCard
              title="Published posts"
              value={formatNumber(metrics.publishedPosts)}
              icon="hugeicons:sent"
              change={percentageChange(
                metrics.publishedPosts,
                metrics.previousPublishedPosts,
              )}
            />
            <MetricCard
              title="Publishing success"
              value={`${metrics.publishingSuccessRate.toFixed(1)}%`}
              icon="hugeicons:checkmark-badge-01"
              change={
                metrics.publishingSuccessRate -
                metrics.previousPublishingSuccessRate
              }
            />
            <MetricCard
              title="Engagements"
              value={formatNumber(metrics.engagement)}
              icon="hugeicons:favourite"
              change={percentageChange(
                metrics.engagement,
                metrics.previousEngagement,
              )}
            />
            <MetricCard
              title="Active channels"
              value={formatNumber(metrics.activeChannels)}
              icon="hugeicons:share-08"
            />
          </section>
        </>
      )}
    </div>
  );
}
