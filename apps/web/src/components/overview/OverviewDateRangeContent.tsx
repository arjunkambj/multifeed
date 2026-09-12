"use client";

import { ChevronLeft, ChevronRight } from "@honeyicons/react";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DatePicker } from "@/components/ui/date-picker";
import {
  type CalendarDateRange,
  DATE_RANGE_PRESETS,
  type DateRangePreset,
  getPresetRange,
} from "@/lib/date-ranges";

type Props = {
  value: CalendarDateRange;
  preset: DateRangePreset | null;
  onChange: (range: CalendarDateRange, preset: DateRangePreset | null) => void;
  onClose: () => void;
};

function calendarDateToDate(date: CalendarDate): Date {
  return new Date(date.year, date.month - 1, date.day);
}

function dateToCalendarDate(date: Date): CalendarDate {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function monthFromRangeEnd(range: CalendarDateRange) {
  return startOfMonth(new Date(range.end.year, range.end.month - 2, 1));
}

function formatMonthRange(start: Date) {
  const end = addMonths(start, 1);
  const startMonth = start.toLocaleString("en", { month: "long" });
  const endMonth = end.toLocaleString("en", { month: "long" });
  if (start.getFullYear() === end.getFullYear()) {
    return `${startMonth} – ${endMonth} ${start.getFullYear()}`;
  }
  return `${startMonth} ${start.getFullYear()} – ${endMonth} ${end.getFullYear()}`;
}

function rangeSelection(range: CalendarDateRange): DateRange {
  return {
    from: calendarDateToDate(range.start),
    to: calendarDateToDate(range.end),
  };
}

export function OverviewDateRangeContent({
  value,
  preset,
  onChange,
  onClose,
}: Props) {
  const [draft, setDraft] = useState(value);
  const [picked, setPicked] = useState<DateRange | undefined>(() =>
    rangeSelection(value),
  );
  const [visibleMonth, setVisibleMonth] = useState(() =>
    monthFromRangeEnd(value),
  );
  const maxDate = today(getLocalTimeZone());
  const maxJsDate = calendarDateToDate(maxDate);
  const maxMonth = startOfMonth(maxJsDate);
  const canGoNext = addMonths(visibleMonth, 2).getTime() <= maxMonth.getTime();

  const commitRange = (
    nextRange: CalendarDateRange,
    nextPreset: DateRangePreset | null,
    close = false,
  ) => {
    setDraft(nextRange);
    setPicked(rangeSelection(nextRange));
    setVisibleMonth(monthFromRangeEnd(nextRange));
    onChange(nextRange, nextPreset);
    if (close) onClose();
  };

  const selectPreset = (nextPreset: DateRangePreset) => {
    commitRange(getPresetRange(nextPreset), nextPreset, true);
  };

  const selectRange = (range: DateRange | undefined) => {
    setPicked(range);
    if (!range?.from) return;
    if (!range.to) {
      const start = dateToCalendarDate(range.from);
      setDraft({ start, end: start });
      return;
    }
    commitRange(
      {
        start: dateToCalendarDate(range.from),
        end: dateToCalendarDate(range.to),
      },
      null,
    );
  };

  const applyDate = (field: "start" | "end", date: Date) => {
    const parsed = dateToCalendarDate(date);
    const candidate = { ...draft, [field]: parsed };
    const nextRange =
      candidate.start.compare(candidate.end) <= 0
        ? candidate
        : { start: candidate.end, end: candidate.start };
    commitRange(nextRange, null);
  };

  return (
    <div className="flex max-sm:flex-col">
      <aside className="w-36 shrink-0 border-r border-border bg-muted/50 p-3 max-sm:w-full max-sm:border-r-0 max-sm:border-b">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Quick ranges
        </p>
        <div className="flex flex-col gap-0.5 max-sm:flex-row max-sm:overflow-x-auto">
          {(Object.keys(DATE_RANGE_PRESETS) as DateRangePreset[]).map((key) => (
            <Button
              key={key}
              variant={preset === key ? "secondary" : "ghost"}
              className="h-7 justify-start whitespace-nowrap px-3 py-0 text-xs"
              onClick={() => selectPreset(key)}
            >
              {DATE_RANGE_PRESETS[key].label}
            </Button>
          ))}
        </div>
      </aside>

      <div className="w-[26.5rem] max-w-full min-w-0 shrink-0 bg-background p-3">
        <div className="mb-3 grid min-w-0 grid-cols-2 gap-2">
          <DatePicker
            aria-label="Start date"
            value={calendarDateToDate(draft.start)}
            maxDate={maxJsDate}
            onChange={(date) => applyDate("start", date)}
          />
          <DatePicker
            aria-label="End date"
            value={calendarDateToDate(draft.end)}
            maxDate={maxJsDate}
            onChange={(date) => applyDate("end", date)}
          />
        </div>

        <div className="mb-1 flex items-center justify-between">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Previous months"
            onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
          >
            <ChevronLeft />
          </Button>
          <p className="text-sm font-medium">
            {formatMonthRange(visibleMonth)}
          </p>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Next months"
            disabled={!canGoNext}
            onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
          >
            <ChevronRight />
          </Button>
        </div>

        <Calendar
          aria-label="Overview date range"
          mode="range"
          resetOnSelect
          numberOfMonths={2}
          weekStartsOn={1}
          hideNavigation
          month={visibleMonth}
          onMonthChange={setVisibleMonth}
          disabled={[{ after: maxJsDate }]}
          selected={picked}
          onSelect={selectRange}
          className="w-full p-0 [--cell-size:--spacing(7)]"
          classNames={{
            root: "w-full",
            months: "relative flex flex-row gap-2",
            month: "flex w-full min-w-0 flex-col gap-2",
            month_caption: "hidden",
            nav: "hidden",
          }}
          formatters={{
            formatWeekdayName: (day) =>
              day.toLocaleDateString("en", { weekday: "short" }),
          }}
        />
      </div>
    </div>
  );
}
