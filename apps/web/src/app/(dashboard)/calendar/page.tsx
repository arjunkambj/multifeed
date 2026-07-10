import { Suspense } from "react";
import { Spinner } from "@heroui/react";
import { PostCalendar } from "@/components/calendar/PostCalendar";

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-40 items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <PostCalendar />
    </Suspense>
  );
}
