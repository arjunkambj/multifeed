import type { Metadata } from "next";
import { OverviewDashboard } from "@/components/overview/OverviewDashboard";

export const metadata: Metadata = {
  title: "Overview",
};

export default function OverviewPage() {
  return <OverviewDashboard />;
}
