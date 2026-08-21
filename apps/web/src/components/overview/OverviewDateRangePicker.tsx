"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { Icon } from "@iconify/react";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import {
  DATE_RANGE_PRESETS,
  type CalendarDateRange,
  type DateRangePreset,
  calendarDateToInputValue,
  getPresetRange,
} from "@/lib/date-ranges";

type Props = {
  value: CalendarDateRange;
  preset: DateRangePreset | null;
  onChange: (range: CalendarDateRange, preset: DateRangePreset | null) => void;
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

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(date: CalendarDate) {
  return dateFormatter.format(calendarDateToDate(date));
}

export function OverviewDateRangePicker({ value, preset, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const maxDate = today(getLocalTimeZone());
  const maxInputDate = calendarDateToInputValue(maxDate);

  const label = preset
    ? DATE_RANGE_PRESETS[preset].label
    : value.start.compare(value.end) === 0
      ? formatDate(value.start)
      : `${formatDate(value.start)} – ${formatDate(value.end)}`;

  const selectPreset = (nextPreset: DateRangePreset) => {
    const range = getPresetRange(nextPreset);
    setDraft(range);
    onChange(range, nextPreset);
    setIsOpen(false);
  };

  const selectRange = (range: DateRange | undefined) => {
    if (!range?.from) return;
    const start = dateToCalendarDate(range.from);
    const end = range.to ? dateToCalendarDate(range.to) : start;
    const nextRange = { start, end };
    setDraft(nextRange);
    if (range.to) {
      onChange(nextRange, null);
      setIsOpen(false);
    }
  };

  const typeDate = (field: "start" | "end", input: string) => {
    if (input.length !== 10) return;
    try {
      const parts = input.split("-").map(Number);
      if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return;
      const [year, month, day] = parts as [number, number, number];
      const parsed = new CalendarDate(year, month, day);
      const candidate = { ...draft, [field]: parsed };
      const nextRange =
        candidate.start.compare(candidate.end) <= 0
          ? candidate
          : { start: candidate.end, end: candidate.start };
      setDraft(nextRange);
      onChange(nextRange, null);
    } catch {
      // Keep the last valid range while the user edits the field.
    }
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) setDraft(value);
      }}
    >
      <PopoverTrigger
        render={
          <Button size="sm" variant="outline" className="min-w-36 justify-between" />
        }
      >
        <Icon icon="hugeicons:calendar-03" width={16} />
        <span className="text-sm font-medium">{label}</span>
        <Icon icon="hugeicons:arrow-down-01" width={14} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto max-w-[calc(100vw-2rem)] p-0">
        <div className="flex max-sm:flex-col">
          <aside className="w-36 shrink-0 border-r border-border bg-muted/50 p-3 max-sm:w-full max-sm:border-r-0 max-sm:border-b">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quick ranges
            </p>
            <div className="flex flex-col gap-0.5 max-sm:flex-row max-sm:overflow-x-auto">
              {(Object.keys(DATE_RANGE_PRESETS) as DateRangePreset[]).map(
                (key) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={preset === key ? "secondary" : "ghost"}
                    className="h-7 justify-start whitespace-nowrap px-3 py-0 text-xs"
                    onClick={() => selectPreset(key)}
                  >
                    {DATE_RANGE_PRESETS[key].label}
                  </Button>
                ),
              )}
            </div>
          </aside>

          <div className="w-[26.5rem] max-w-full shrink-0 overflow-x-auto bg-background p-3">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <Input
                aria-label="Start date"
                type="date"
                max={maxInputDate}
                className="h-9 text-sm"
                value={calendarDateToInputValue(draft.start)}
                onChange={(event) => typeDate("start", event.currentTarget.value)}
              />
              <Input
                aria-label="End date"
                type="date"
                max={maxInputDate}
                className="h-9 text-sm"
                value={calendarDateToInputValue(draft.end)}
                onChange={(event) => typeDate("end", event.currentTarget.value)}
              />
            </div>

            <Calendar
              aria-label="Overview date range"
              mode="range"
              numberOfMonths={2}
              weekStartsOn={1}
              disabled={[{ after: calendarDateToDate(maxDate) }]}
              selected={{
                from: calendarDateToDate(draft.start),
                to: calendarDateToDate(draft.end),
              }}
              onSelect={selectRange}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
