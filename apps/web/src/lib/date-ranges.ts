import {
  type CalendarDate,
  getLocalTimeZone,
  today,
} from "@internationalized/date";

export const DATE_RANGE_PRESETS = {
  today: { label: "Today" },
  yesterday: { label: "Yesterday" },
  last_7_days: { label: "Last 7 days" },
  last_30_days: { label: "Last 30 days" },
  this_month: { label: "This month" },
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
    case "this_month":
      return { start: currentDate.set({ day: 1 }), end: currentDate };
  }
}

export function calendarDateToInputValue(date: CalendarDate) {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
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
