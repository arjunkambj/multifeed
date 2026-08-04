"use client";

import { useMemo, useState } from "react";
import {
  keepPreviousData,
  useQuery as usePointInTimeQuery,
} from "@tanstack/react-query";
import { Card, Separator, Skeleton } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useConvex } from "convex/react";
import { api } from "@convex/_generated/api";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { OverviewDateRangePicker } from "@/components/overview/OverviewDateRangePicker";
import {
  type CalendarDateRange,
  type DateRangePreset,
  calendarDateRangeToMilliseconds,
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
      ? "text-muted"
      : trend > 0
        ? "text-success"
        : "text-danger";

  return (
    <Card variant="secondary" className="shadow-none">
      <Card.Content className="justify-between">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-sm font-medium text-foreground">
            {title}
          </p>
          <Icon icon={icon} width={18} className="shrink-0 text-muted" />
        </div>
        <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </p>
        <div>
          <Separator className="mb-2" />
          {trend == null ? (
            <p className="text-xs text-muted">Current workspace total</p>
          ) : (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span
                className={`flex items-center gap-1 font-medium ${trendColor}`}
              >
                <Icon
                  icon={
                    trend < 0
                      ? "hugeicons:arrow-down-02"
                      : "hugeicons:arrow-up-02"
                  }
                  width={13}
                />
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
              <span className="text-muted">vs previous period</span>
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-28 rounded-2xl" />
      ))}
    </div>
  );
}

export function OverviewDashboard() {
  const convex = useConvex();
  const [range, setRange] = useState<CalendarDateRange>(() =>
    getPresetRange("today"),
  );
  const [preset, setPreset] = useState<DateRangePreset | null>("today");
  const queryRange = useMemo(
    () => calendarDateRangeToMilliseconds(range),
    [range],
  );
  const metricsQuery = usePointInTimeQuery({
    placeholderData: keepPreviousData,
    queryFn: () => convex.query(api.posts.overviewMetrics, queryRange),
    queryKey: ["overview-metrics", queryRange.startMs, queryRange.endMs],
    throwOnError: true,
  });
  const metrics = metricsQuery.data;

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
        <section
          aria-busy={metricsQuery.isFetching}
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
      )}
    </div>
  );
}
