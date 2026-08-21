import type { Metadata } from "next";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";

export const metadata: Metadata = {
  title: "Inbox",
};

export default function InboxPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardPageTitle
        title="Inbox"
        description="Review comments, mentions, and messages across connected accounts."
      />
    </div>
  );
}
