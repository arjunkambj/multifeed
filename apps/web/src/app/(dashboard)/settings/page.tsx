import { Suspense } from "react";
import { preloadQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { SettingsLayout } from "@/components/settings";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";
import { requireDashboardSession } from "@/hexclave/dashboard-session";
import { isSettingsTab } from "@/lib/settings-tabs";
import { currentTimeBucket } from "@/lib/time-bucket";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function SettingsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const selectedTab = isSettingsTab(rawTab) ? rawTab : "general";
  const preloadedSubscription =
    selectedTab === "billing"
      ? await requireDashboardSession().then(({ convexToken }) =>
          preloadQuery(
            api.billing.getSubscription,
            { nowMs: currentTimeBucket() },
            { token: convexToken },
          ),
        )
      : undefined;

  return (
    <SettingsLayout
      preloadedSubscription={preloadedSubscription}
      selectedTab={selectedTab}
    />
  );
}

export default function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="settings" />}>
      <SettingsContent searchParams={searchParams} />
    </Suspense>
  );
}
