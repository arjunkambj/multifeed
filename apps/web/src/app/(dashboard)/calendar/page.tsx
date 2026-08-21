import type { Metadata } from "next";
import { Suspense } from "react";
import { PostCalendar } from "@/components/calendar/PostCalendar";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";

export const metadata: Metadata = {
  title: "Calendar",
};

export default function CalendarPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="calendar" />}>
      <PostCalendar />
    </Suspense>
  );
}
