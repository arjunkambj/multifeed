import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";
import { SettingsLayout } from "@/components/settings";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="settings" />}>
      <SettingsLayout />
    </Suspense>
  );
}
