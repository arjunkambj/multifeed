"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useState } from "react";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { MetricCard } from "@/components/overview/MetricCard";
import { OverviewDateRangePicker } from "@/components/overview/OverviewDateRangePicker";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type CalendarDateRange,
  calendarDateRangeToMilliseconds,
  type DateRangePreset,
  getPresetRange,
} from "@/lib/date-ranges";

const numberFormatter = new Intl.NumberFormat("en-US");

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function MetricsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-28" />
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
            aria-label="Publishing KPIs"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5"
          >
            <MetricCard
              title="Scheduled posts"
              value={numberFormatter.format(metrics.scheduledPosts)}
              icon="hugeicons:calendar-03"
              change={percentageChange(
                metrics.scheduledPosts,
                metrics.previousScheduledPosts,
              )}
            />
            <MetricCard
              title="Published posts"
              value={numberFormatter.format(metrics.publishedPosts)}
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
              value={numberFormatter.format(metrics.engagement)}
              icon="hugeicons:favourite"
              change={percentageChange(
                metrics.engagement,
                metrics.previousEngagement,
              )}
            />
            <MetricCard
              title="Active channels"
              value={numberFormatter.format(metrics.activeChannels)}
              icon="hugeicons:share-08"
            />
          </section>
        </>
      )}
    </div>
  );
}
