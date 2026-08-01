import { Suspense } from "react";
import { PostCalendar } from "@/components/calendar/PostCalendar";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";

export default function CalendarPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="calendar" />}>
      <PostCalendar />
    </Suspense>
  );
}
