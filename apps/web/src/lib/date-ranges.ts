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

export function getPresetRange(preset: DateRangePreset): CalendarDateRange {
  const currentDate = today(getLocalTimeZone());

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

export function calendarDateRangeToMilliseconds(range: CalendarDateRange) {
  const start = new Date(range.start.year, range.start.month - 1, range.start.day);
  const end = new Date(
    range.end.year,
    range.end.month - 1,
    range.end.day + 1,
  );

  return { startMs: start.getTime(), endMs: end.getTime() - 1 };
}
