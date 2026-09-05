import {
  type CalendarDate,
  endOfMonth,
  getLocalTimeZone,
  startOfMonth,
  startOfWeek,
  today,
} from "@internationalized/date";

export const DATE_RANGE_PRESETS = {
  today: { label: "Today" },
  yesterday: { label: "Yesterday" },
  last_7_days: { label: "Last 7 days" },
  last_30_days: { label: "Last 30 days" },
  week_to_date: { label: "Week to date" },
  month_to_date: { label: "Month to date" },
  last_month: { label: "Last month" },
} as const;

export type DateRangePreset = keyof typeof DATE_RANGE_PRESETS;

export type CalendarDateRange = {
  start: CalendarDate;
  end: CalendarDate;
};

const DAY_MS = 86_400_000;
const CALENDAR_PRELOAD_PAD_MS = 70 * DAY_MS;

export function getPresetRange(
  preset: DateRangePreset,
  timeZone: string = getLocalTimeZone(),
): CalendarDateRange {
  const currentDate = today(timeZone);

  switch (preset) {
    case "today":
      return { start: currentDate, end: currentDate };
    case "yesterday": {
      const yesterday = currentDate.subtract({ days: 1 });
      return { start: yesterday, end: yesterday };
    }
    case "last_7_days":
      return { start: currentDate.subtract({ days: 6 }), end: currentDate };
    case "last_30_days":
      return { start: currentDate.subtract({ days: 29 }), end: currentDate };
    case "week_to_date":
      return {
        start: startOfWeek(currentDate, "en-US", "mon"),
        end: currentDate,
      };
    case "month_to_date":
      return { start: startOfMonth(currentDate), end: currentDate };
    case "last_month": {
      const previousMonth = currentDate.subtract({ months: 1 });
      return {
        start: startOfMonth(previousMonth),
        end: endOfMonth(previousMonth),
      };
    }
  }
}

/** Wide, timezone-agnostic window so calendar preload covers month/week views. */
export function defaultCalendarRangeMs(now = Date.now()) {
  return {
    startMs: now - CALENDAR_PRELOAD_PAD_MS,
    endMs: now + CALENDAR_PRELOAD_PAD_MS,
  };
}

export function calendarDateRangeToMilliseconds(
  range: CalendarDateRange,
  timeZone: string = getLocalTimeZone(),
) {
  const start = range.start.toDate(timeZone);
  const end = range.end.add({ days: 1 }).toDate(timeZone);
  return { startMs: start.getTime(), endMs: end.getTime() - 1 };
}
