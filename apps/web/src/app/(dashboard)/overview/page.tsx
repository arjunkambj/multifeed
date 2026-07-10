import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardPageTitle
        title="Overview"
        description="Your publishing workspace at a glance."
      />
    </div>
  );
}
